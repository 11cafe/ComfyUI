import Flex from "@/components/ui/Flex";
import { useEffect, useState } from "react";
import { fetchCurrentUser } from "./UserManagerAPI";
import { ComfyUser } from "@/type/dbTypes";

export default function ProfileTopbar(
  {
    //   user,
    //   setUser,
  }: {
    //   user?: ComfyUser & {
    //     balance?: string;
    //   };
    //   setUser: (user: ComfyUser) => void;
  },
) {
  const [user, setUser] = useState<ComfyUser & { balance?: string }>();
  useEffect(() => {
    console.log("fetching user");
    fetch("/api/user/getCurrentUser")
      .then((res) => res.json())
      .then((data) => {
        setUser(data);
      });
  }, []);
  if (!user) {
    return (
      <a
        style={{ cursor: "pointer" }}
        onClick={() => {
          window.parent.postMessage(
            {
              type: "change_url",
              url: "/auth/signin",
            },
            "*",
          );
        }}
      >
        Login
      </a>
    );
  }
  return (
    <Flex className="items-center gap-2">
      <a href={`/profile/${user.username}`} target="_blank">
        <img
          src={user.imageUrl ?? `/assets/user_placeholder.png`}
          alt="avatar"
          className="w-6 h-6 rounded-full"
        />
      </a>
    </Flex>
  );
}
