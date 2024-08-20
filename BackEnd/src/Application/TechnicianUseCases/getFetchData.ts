import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";




export const GetDashboardData = (dependencies: any) => {

    console.log("getDashboardData function")
    const { getDashboardbyidRepo } = dependencies.repositery;

    const executeFunction = async (techId: any) => {
        try {
            // Fetch user data
            const responseFromUserList = await getDashboardbyidRepo.PostExit(techId);

            // Debugging: Log the fetched user data
            console.log("Fetched user data:", responseFromUserList);

            // Return the fetched user data
            return {
                status: true,
                message: "User data fetched successfully",
                data: responseFromUserList
            };

        } catch (error) {
            // Handle any unexpected errors
            console.error("Error fetching user list:", error);
            return {
                status: false,
                message: "An error occurred while fetching user list",
                data: null
            };
        }
    };

    return { executeFunction };
};