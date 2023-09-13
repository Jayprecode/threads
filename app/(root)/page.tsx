import React from "react";
import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { fetchUser } from "@/lib/actions/user.actions";

const Page = async () => {
	const user = await currentUser();
	if (!user) return null;

	const userInfo = await fetchUser(user.id);
	// If User is not onboarded, redirect them to /onbaording
	if (!userInfo?.onboarded) redirect("/onboarding");

	return (
		<>
			<h1 className="head-text">Home</h1>
		</>
	);
};

export default Page;
