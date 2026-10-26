---
description: Compare how your FeedNest sources covered the same story
argument-hint: "[story or topic]"
---

Compare how my FeedNest sources covered this story: $ARGUMENTS

Use only the FeedNest tools and the articles they return, never the open web.

1. If I named no story, call `get_articles` with `view: "newsfeed"` and `limit: 50`, pick the story that the most sources cover, and say which one you picked. Otherwise call `get_articles` with `view: "newsfeed"`, `query` set to the story's key words and `limit: 50`.
2. Keep only the articles about this same story, at most two per source. If fewer than two sources covered it, say so and stop: there is nothing to compare.
3. Read the kept articles with `get_article`, six at most. On Plus and Pro, load the full text with `extract_article` when an article reads in under a minute.
4. Write the comparison:
   - the facts every source reports;
   - what only some sources report, and what each one leaves out;
   - the differences in angle, emphasis and tone, with a short quote from each source;
   - figures or claims that disagree.
   Name the source for every point.
5. End with the articles you compared, one per line as "title (source)".

On the Free plan FeedNest allows 20 tool calls an hour, so keep the comparison under ten calls. If a tool says my plan does not include something, say so plainly and carry on without it.

Write in the language I have been using in this conversation, or in English if there is none.
