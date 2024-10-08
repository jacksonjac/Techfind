import mongoose from 'mongoose';
import { Designation } from '../../Database'; // Adjust the path to your Admin model

export default {
    PostExit: async () => {
        console.log("Inside PostExit functionm  userlist");

        try {
            // Fetch all users from the database
            const Technicians = await Designation.find({});
            console.log(Technicians, "Admin found");

            if (Technicians.length > 0) {
                // If users are found, return them with a success status
                return { status: true, Data: Technicians };
            } else {
                // If no users are found, return a message indicating this
                return { status: false, message: "No users found" };
            }
        } catch (error) {
            console.error("Error in PostExit function:", error);
            // Return a failure status with an error message
            return { status: false, message: "An error occurred" };
        }
    }
};