import { Client } from "@notionhq/client";

const token = process.env.NOTION_TOKEN;
if (!token) {
  throw new Error("[NOTION] Missing NOTION_TOKEN in .env");
}

export const notion = new Client({ auth: token });

export const resourceIds = {
  postsDb: process.env.NOTION_DB_POSTS,
  profilePage: process.env.NOTION_PROFILE_PAGE,
};
