"use server";

import { FilterQuery, SortOrder } from "mongoose";
import { revalidatePath } from "next/cache";

import User from "../models/user.model";
import { connectToDB } from "../mongoose";
import Thread from "../models/thread.model";

interface Params {
	userId: string;
	username: string;
	name: string;
	bio: string;
	image: string;
	path: string;
}

export const updateUser = async ({ userId, username, name, bio, image, path }: Params): Promise<void> => {
	connectToDB();

	try {
		await User.findOneAndUpdate(
			{
				id: userId,
			},
			{
				username: username.toLowerCase(),
				name,
				bio,
				image,
				onboarded: true,
			},
			{ upsert: true }
		);

		if (path === "/profile/edit") {
			revalidatePath(path);
		}
	} catch (error: any) {
		console.error(error);
		throw new Error(`Error creating/updating user: ${error.message}`);
	}
};

export const fetchUser = async (userId: string) => {
	try {
		connectToDB();

		return await User.findOne({ id: userId });
	} catch (error: any) {
		console.error(error);
		throw new Error(`Error fetching user: ${error.message}`);
	}
};

export const fetchUserPosts = async (userId: string) => {
	try {
		connectToDB();

		// Find all threads authored by the user with the given userId
		const threads = await User.findOne({ id: userId }).populate({
			path: "threads",
			model: Thread,
			populate: [
				{
					path: "children",
					model: Thread,
					populate: {
						path: "author",
						model: User,
						select: "name image id", // Select the "name" and "_id" fields from the "User" model
					},
				},
			],
		});
		return threads;
	} catch (error) {
		console.error("Error fetching user threads:", error);
		throw error;
	}
};

// Almost similar to Thead (search + pagination) and Community (search + pagination)
export const fetchUsers = async ({
	userId,
	searchString = "",
	pageNumber = 1,
	pageSize = 20,
	sortBy = "desc",
}: {
	userId: string;
	searchString?: string;
	pageNumber?: number;
	pageSize?: number;
	sortBy?: SortOrder;
}) => {
	try {
		connectToDB();

		// Calculate the number of users to skip based on the page number and page size.
		const skipAmount = (pageNumber - 1) * pageSize;

		// Create a case-insensitive regular expression for the provided search string.
		const regex = new RegExp(searchString, "i");

		// Create an initial query object to filter users.
		const query: FilterQuery<typeof User> = {
			id: { $ne: userId }, // Exclude the current user from the results.
		};

		// If the search string is not empty, add the $or operator to match either username or name fields.
		if (searchString.trim() !== "") {
			query.$or = [{ username: { $regex: regex } }, { name: { $regex: regex } }];
		}

		// Define the sort options for the fetched users based on createdAt field and provided sort order.
		const sortOptions = { createdAt: sortBy };

		const usersQuery = User.find(query).sort(sortOptions).skip(skipAmount).limit(pageSize);

		// Count the total number of users that match the search criteria (without pagination).
		const totalUsersCount = await User.countDocuments(query);

		const users = await usersQuery.exec();

		// Check if there are more users beyond the current page.
		const isNext = totalUsersCount > skipAmount + users.length;

		return { users, isNext };
	} catch (error) {
		console.error("Error fetching users:", error);
		throw error;
	}
};
