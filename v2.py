import cv2
import numpy as np
import math
import time
import threading

# Initialize the camera
cap = cv2.VideoCapture("http://172.17.0.57:8080/video")

# Known parameters (calibrate these for your specific setup)
KNOWN_BALL_DIAMETER = 1.0  # inches (diameter of the ball you're detecting)
KNOWN_DISTANCE = 7.0       # inches (distance from camera when calibration was done)
KNOWN_RADIUS_PX = 130       # pixels (radius of ball in pixels at known distance)

# Calculate the focal length
FOCAL_LENGTH = (KNOWN_RADIUS_PX * KNOWN_DISTANCE) / (KNOWN_BALL_DIAMETER / 2)

# Base tracking parameters
BASE_UPDATE_INTERVAL = 0.1  # seconds between base position updates

# Camera offset compensation (1 inch to the left of arm)
CAMERA_OFFSET = 1  # inches (positive means camera is to the left of arm)

# Replace serial communication with MQTT
import paho.mqtt.client as mqtt

# MQTT_BROKER = "test.mosquitto.org"
MQTT_BROKER = "broker.hivemq.com"
MQTT_PORT = 1883
MQTT_TOPIC_COMMAND = "robot/command"

client = mqtt.Client()

# Connect to MQTT broker
client.connect(MQTT_BROKER, MQTT_PORT, 60)

# Start the MQTT client in a background thread
mqtt_thread = threading.Thread(target=client.loop_forever)
mqtt_thread.daemon = True
mqtt_thread.start()

print("MQTT connection established")

# Function to send commands via MQTT
def send_mqtt_command(command, device_address="9"):
    """
    Send command via MQTT with device address prefix
    
    Args:
        command: The command to send (e.g., "B90", "H", "D3")
        device_address: The device address (default: "9" for Arduino)
    """
    formatted_command = f"{device_address}|{command}"
    client.publish(MQTT_TOPIC_COMMAND, formatted_command)
    print(f"Sent via MQTT: {formatted_command}")
# --- ARM CONTROLLER INTEGRATION ---
class ArmController:
    def __init__(self):
        self.current_base_pos = 90
        self.last_base_update = time.time()
        self.is_picking = False
        self.device_address = "9"  # Arduino address
        
    def set_base_position(self, angle):
        """Send base position command via MQTT"""
        angle = max(0, min(180, int(angle)))
        command_string = f"B{angle}"
        send_mqtt_command(command_string, self.device_address)
        print(f"Base command: B{angle}")
        self.current_base_pos = angle
        return angle
    
    def calculate_base_position(self, ball_x, frame_width, ball_distance):
        """Calculate base position using proportional control with camera offset compensation"""
        # Clamp ball position to frame boundaries to prevent extreme values
        clamped_ball_x = max(0, min(ball_x, frame_width))
        
        # Calculate error from center (how far ball is from center of frame)
        center_x = frame_width / 2
        error = clamped_ball_x - center_x
        
        # Normalize error to range -1 to 1
        normalized_error = error / center_x
        
        # Determine camera offset based on x position
        if ball_x > 800:
            camera_offset = 0
        else:
            camera_offset = 3

        # Calculate camera offset compensation
        # tan(θ) = opposite/adjacent = offset/distance
        if ball_distance > 0:
            offset_angle = math.degrees(math.atan(abs(camera_offset) / ball_distance))
            if camera_offset < 0:
                base_offset = -offset_angle  # Negative because camera is left of arm
            else:
                base_offset = offset_angle   # Positive if camera is right of arm
        else:
            base_offset = 0

        # Map to base angle range with specific mappings for x positions 800 and 1600
        if ball_x == 800:
            base_angle = 100
        elif ball_x == 1600:
            base_angle = 130
        else:
            # General mapping
            base_angle = 90 + (normalized_error * 60) + base_offset

        # Add extra clamping to prevent extreme movements
        return max(40, min(140, int(base_angle)))

    def update_base_tracking(self, ball_x, frame_width, ball_distance, current_time):
        """Update base position with camera offset compensation and bounds checking"""
        if current_time - self.last_base_update >= BASE_UPDATE_INTERVAL:
            # Clamp ball position to reasonable bounds
            clamped_ball_x = max(0, min(ball_x, frame_width * 1.5))  # Allow some overflow but limit
            
            target_base_pos = self.calculate_base_position(clamped_ball_x, frame_width, ball_distance)
            
            # Calculate error from center for display
            center_x = frame_width / 2
            error = clamped_ball_x - center_x
            normalized_error = error / center_x  # -1 to 1 range
            
            # Calculate camera offset compensation for display
            if ball_distance > 0:
                offset_angle = math.degrees(math.atan(abs(CAMERA_OFFSET) / ball_distance))
                if CAMERA_OFFSET < 0:
                    base_offset = -offset_angle
                else:
                    base_offset = offset_angle
            else:
                base_offset = 0
            
            # Add extra smoothing and limits to prevent over-rotation
            max_step = 5  # Maximum degrees to move per update
            step_size = (target_base_pos - self.current_base_pos) * 0.3  # 30% of error
            
            # Clamp step size to prevent large jumps
            step_size = max(-max_step, min(max_step, step_size))
            
            if abs(step_size) > 1:  # Only move if step is significant
                new_pos = self.current_base_pos + step_size
                self.current_base_pos = self.set_base_position(new_pos)
            
            # Display tracking info
            print(f"Base tracking: BallX={ball_x}->{clamped_ball_x}/{frame_width} Error={normalized_error:.2f} " +
                f"Offset={base_offset:.1f}° Current: {self.current_base_pos}° Target: {target_base_pos}° " +
                f"Step: {step_size:.1f}°")
            
            self.last_base_update = current_time
            
            # Return tracking info for display on video feed
            return {
                'ball_x': ball_x,
                'clamped_x': clamped_ball_x,
                'frame_width': frame_width,
                'error': normalized_error,
                'offset': base_offset,
                'current_pos': self.current_base_pos,
                'target_pos': target_base_pos
            }
        
        return None

    def go_home(self):
        """Move arm to home position"""
        send_mqtt_command("H", self.device_address)
        self.current_base_pos = 90
        print("Sent home command")
    
    def run_distance_pickup(self, distance):
        """Run the appropriate pickup sequence based on distance"""
        if self.is_picking:
            print("Already in the middle of a pickup sequence!")
            return
            
        print(f"Executing {distance}-inch pickup sequence")
        self.is_picking = True
        
        # Send the distance command (D3, D4, D5, or D6)
        command = f"D{distance}"
        send_mqtt_command(command, self.device_address)
        
        # Start a thread to monitor when the pickup is complete
        thread = threading.Thread(target=self._monitor_pickup_completion)
        thread.daemon = True
        thread.start()
    
    def _monitor_pickup_completion(self):
        """Monitor when the pickup is complete"""
        # Wait a reasonable amount of time for the pickup to complete
        time.sleep(12)  # Adjust based on your sequence duration
        
        # Mark picking as complete
        self.is_picking = False
        print("Pickup sequence completed")

# --- BALL DETECTOR ---
class BallDetector:
    def __init__(self):
        # HSV range for red color
        self.lower_red1 = np.array([0, 100, 100])
        self.upper_red1 = np.array([10, 255, 255])
        self.lower_red2 = np.array([160, 100, 100])
        self.upper_red2 = np.array([180, 255, 255])
        
        # Initialize arm controller
        self.arm_controller = ArmController()
        
        # Make global variables instance variables
        self.known_radius_px = KNOWN_RADIUS_PX
        self.focal_length = FOCAL_LENGTH
        self.known_distance = KNOWN_DISTANCE
        self.known_ball_diameter = KNOWN_BALL_DIAMETER
        
        # Variables for stability checking
        self.stable_start_time = None
        self.stable_distance = None
        self.stable_position = None
        self.stability_threshold = 10  # pixels movement allowed for stability
        self.stability_duration = 1.0  # seconds of stability required
        
    def distance_to_camera(self, radius_px):
        """Calculate distance from camera to object using the correct formula"""
        if radius_px <= 0:
            return 0
        
        # Correct formula: distance = (focal_length * actual_diameter) / apparent_diameter_in_pixels
        distance = (self.focal_length * self.known_ball_diameter) / (2 * radius_px)
        return distance
    
    def detect_ball(self, frame):
        """Detect red ball in the frame and return its position and radius"""
        # Skip detection if picking is in progress
        if self.arm_controller.is_picking:
            return None, 0
            
        # Convert to HSV color space
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        
        # Create masks for red color
        mask1 = cv2.inRange(hsv, self.lower_red1, self.upper_red1)
        mask2 = cv2.inRange(hsv, self.lower_red2, self.upper_red2)
        red_mask = cv2.bitwise_or(mask1, mask2)
        
        # Apply morphological operations to remove noise
        kernel = np.ones((5, 5), np.uint8)
        red_mask = cv2.morphologyEx(red_mask, cv2.MORPH_CLOSE, kernel)
        red_mask = cv2.morphologyEx(red_mask, cv2.MORPH_OPEN, kernel)
        
        # Find contours
        contours, _ = cv2.findContours(red_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if len(contours) > 0:
            # Find the largest contour
            largest_contour = max(contours, key=cv2.contourArea)
            
            # Find the minimum enclosing circle
            ((x, y), radius) = cv2.minEnclosingCircle(largest_contour)
            
            # Only proceed if the radius meets a minimum size
            if radius > 5:
                return (int(x), int(y)), radius
        
        return None, 0
    
    def check_stability(self, position, distance, current_time):
        """Check if the ball has been stable for the required duration"""
        # Skip stability check if picking is in progress
        if self.arm_controller.is_picking:
            return False
            
        if self.stable_position is None:
            # First detection, start stability timer
            self.stable_position = position
            self.stable_distance = distance
            self.stable_start_time = current_time
            return False
        
        # Check if position has changed significantly
        position_change = math.sqrt((position[0] - self.stable_position[0])**2 + 
                                   (position[1] - self.stable_position[1])**2)
        
        distance_change = abs(distance - self.stable_distance)
        
        if position_change > self.stability_threshold or distance_change > 0.5:
            # Ball moved too much, reset stability timer
            self.stable_position = position
            self.stable_distance = distance
            self.stable_start_time = current_time
            return False
        
        # Check if stable for required duration
        if current_time - self.stable_start_time >= self.stability_duration:
            return True
        
        return False
    
    def determine_pickup_distance(self, actual_distance):
        """Determine which pickup distance to use based on the measured distance"""
        # Skip if picking is in progress
        if self.arm_controller.is_picking:
            return None
            
        # Define distance ranges for each pickup function
        if 2.5 <= actual_distance < 3.5:
            return 3
        elif 3.5 <= actual_distance < 4.5:
            return 4
        elif 4.5 <= actual_distance < 5.5:
            return 5
        elif 5.5 <= actual_distance < 6.5:
            return 6
        else:
            return None  # Outside pickup range
    
    def call_pickup_function(self, distance):
        """Call the appropriate pickup function based on distance"""
        if distance in [3, 4, 5, 6]:
            print(f"Calling {distance}-inch pickup function")
            self.arm_controller.run_distance_pickup(distance)
        else:
            print(f"No pickup function defined for {distance} inches")
        
        # Reset stability after calling pickup function
        self.stable_start_time = None
        self.stable_distance = None
        self.stable_position = None
    
    def manual_calibration(self, radius):
        """Manual calibration function"""
        # Skip if picking is in progress
        if self.arm_controller.is_picking:
            print("Cannot calibrate during pickup sequence")
            return
            
        self.known_radius_px = radius
        self.focal_length = (self.known_radius_px * self.known_distance) / (self.known_ball_diameter / 2)
        print(f"Manual calibration: Radius = {self.known_radius_px:.1f} px, Focal length = {self.focal_length:.2f}")
    
    def run(self):
        """Main loop for ball detection and pickup"""
        print("Starting ball detection. Press 'c' to calibrate, 'q' to quit.")
        print(f"Calibration: {self.known_radius_px}px radius at {self.known_distance} inches")
        print(f"Focal length: {self.focal_length:.2f}")
        print("Ball must be stable for 2 seconds before automatic pickup")
        print(f"Camera offset compensation: {CAMERA_OFFSET} inches to the left")
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Flip frame horizontally for mirror effect
            frame = cv2.flip(frame, 0)
            
            # Get current time
            current_time = time.time()
            
            # Detect ball (will return None if picking is in progress)
            center, radius = self.detect_ball(frame)
            
            # Initialize variables
            distance = 0
            pickup_distance = None
            is_stable = False
            stability_progress = 0
            
            # Check if picking is in progress
            if self.arm_controller.is_picking:
                # Display picking in progress message
                cv2.putText(frame, "PICKUP IN PROGRESS", (10, 30), 
                           cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 255), 3)
                cv2.putText(frame, "Please wait...", (10, 70), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            elif center is not None and radius > 0:
                # Draw circle and center
                cv2.circle(frame, center, int(radius), (0, 255, 0), 2)
                cv2.circle(frame, center, 5, (0, 0, 255), -1)
                
                # Calculate distance
                distance = self.distance_to_camera(radius)
                
                # Update base position to track ball's x-axis movement with camera offset compensation
                tracking_info = self.arm_controller.update_base_tracking(center[0], frame.shape[1], distance, current_time)

                # Display tracking information on video feed
                if tracking_info:
                    cv2.putText(frame, f"X: {tracking_info['ball_x']}/{tracking_info['frame_width']}", (10, 210), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
                    cv2.putText(frame, f"Error: {tracking_info['error']:.2f}", (10, 230), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
                    cv2.putText(frame, f"Base: {tracking_info['current_pos']}° -> {tracking_info['target_pos']}°", (10, 250), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

                # Draw center line and ball X position marker
                center_x = frame.shape[1] // 2
                cv2.line(frame, (center_x, 0), (center_x, frame.shape[0]), (0, 0, 255), 1)  # Red center line
                cv2.line(frame, (center[0], center[1] - 10), (center[0], center[1] + 10), (0, 255, 255), 2)  # Yellow X marker
                
                # Check stability
                is_stable = self.check_stability(center, distance, current_time)
                
                # Calculate stability progress
                if self.stable_start_time is not None:
                    stability_progress = min(1.0, (current_time - self.stable_start_time) / self.stability_duration)
                
                # Determine pickup distance
                pickup_distance = self.determine_pickup_distance(distance)
                
                # Display information
                cv2.putText(frame, f"Radius: {radius:.1f} px", (10, 30), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                cv2.putText(frame, f"Distance: {distance:.1f} in", (10, 60), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                cv2.putText(frame, f"Base: {self.arm_controller.current_base_pos}°", (10, 90), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                
                # Display stability information
                if is_stable:
                    cv2.putText(frame, "STABLE - READY FOR PICKUP", (10, 120), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                    
                    # Automatically call pickup function if stable
                    if pickup_distance:
                        self.call_pickup_function(pickup_distance)
                        # Add a delay to prevent immediate re-detection
                        time.sleep(1)
                else:
                    # Draw stability progress bar
                    bar_width = 200
                    bar_height = 20
                    cv2.rectangle(frame, (10, 120), (10 + bar_width, 120 + bar_height), (100, 100, 100), -1)
                    cv2.rectangle(frame, (10, 120), (10 + int(bar_width * stability_progress), 120 + bar_height), (0, 255, 0), -1)
                    cv2.putText(frame, f"Stability: {stability_progress*100:.1f}%", (10, 160), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                
                if pickup_distance:
                    cv2.putText(frame, f"Pickup: {pickup_distance} in", (10, 190), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                else:
                    cv2.putText(frame, "Out of range", (10, 190), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            else:
                # Display message when no ball is detected
                cv2.putText(frame, "No ball detected", (10, 30), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                
                # Reset stability when no ball is detected
                self.stable_start_time = None
                self.stable_distance = None
                self.stable_position = None
            
            
            # Display the frame
            cv2.imshow('Ball Detection', frame)
            
            # Check for key presses
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('c'):
                # Manual calibration
                if center is not None and radius > 0 and not self.arm_controller.is_picking:
                    self.manual_calibration(radius)
            elif key == ord('h'):
                # Manual home command
                if not self.arm_controller.is_picking:
                    self.arm_controller.go_home()
        
        # Clean up
        cap.release()
        cv2.destroyAllWindows()

if __name__ == "__main__":
    # Start ball detection
    detector = BallDetector()
    detector.run()