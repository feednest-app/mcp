---
description: Your week in FeedNest: what you read, highlighted and noted, and what you missed
argument-hint: "[folder or topic]"
---

Give me my weekly review from FeedNest. $ARGUMENTS

Use only the FeedNest tools, never the open web.

1. Call `get_recently_read` with `limit: 100` to see what I read. On Pro, pass `since` set to seven days ago; on the other plans, keep the articles I opened in the last seven days.
2. On Plus and Pro:
   - call `get_articles` with `view: "highlighted"` and again with `view: "noted"`, `limit: 50` each, and keep this week's articles;
   - call `get_stats` for my reading streak and reading time.
   On Free these are not included: say in one line that highlights lists, notes and reading statistics come with Plus, and carry on.
3. Call `get_articles` with `view: "newsfeed"`, `unread_only: true` and `limit: 100` to see what is still unread.
4. Write the review:
   - what I read: how many articles, from which sources, grouped into a few themes;
   - on Plus and Pro, what I highlighted and noted, with the passages that stand out, and my streak and reading time;
   - the themes that kept coming up;
   - three to five unread articles worth my time, one per line as "title (source)", and why each one.
   If I named a folder or a topic, keep the whole review to it.
5. End by offering to save the suggested articles or to mark the rest of the week's unread articles as read. Ask before marking anything as read.

This takes about five tool calls, well within the Free plan's 20 an hour.

Write in the language I have been using in this conversation, or in English if there is none.
