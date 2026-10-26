---
description: Briefing of what's new in your FeedNest feeds, grouped by topic
argument-hint: "[folder, topic or time span]"
---

Give me a briefing of what's new in my FeedNest feeds. $ARGUMENTS

Use only the FeedNest tools and the articles they return, never the open web.

1. Call `get_articles` once with `view: "newsfeed"`, `unread_only: true` and `limit: 100`.
   - If I named a folder, find its ID with `get_folders` and use `view: "by-folder"` with `folder_id`.
   - If I named a topic, pass it as `query`.
   - Use `date_from` and `date_to` only if I asked for a time span. They need the Pro plan: if the tool says my plan does not include them, carry on without them.
2. Build the briefing from each article's title, source and `summary_preview`. Do not open the articles one by one: on the Free plan FeedNest allows 20 tool calls an hour, so a briefing should take one or two calls.
3. Group the stories into at most seven topics, the most important first. Under each topic, give one line per story: the title, the source in brackets, and what is new in a few words. Say when several of my sources cover the same story.
4. If you got 100 articles, there may be more: say so, and offer to continue with the next page (`before_published_at` and `before_id` of the last article).
5. End by offering to read any story in full, or to mark the articles you covered as read. Ask before marking anything as read.

If nothing is unread, say so and offer the latest articles instead. If FeedNest says I follow no sources yet, point me to feednest.com to add some.

Write the briefing in the language I have been using in this conversation, or in English if there is none.
