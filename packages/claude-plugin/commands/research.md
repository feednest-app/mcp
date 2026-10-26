---
description: Research a topic across your FeedNest sources, with every source cited
argument-hint: "<topic or question>"
---

Research this in my FeedNest sources: $ARGUMENTS

Use only the FeedNest tools and the articles they return, never the open web.

1. If I gave no topic, ask me for one and stop.
2. Call `get_articles` with `view: "newsfeed"`, `query` set to the topic's key words (not a whole sentence) and `limit: 50`. If it finds little, try once more with a synonym or a broader word.
3. Pick the three to five most relevant articles from their titles, sources and `summary_preview`, and read them with `get_article`. If one reads in under a minute, the feed probably sent only an excerpt: on Plus and Pro, load the full text with `extract_article`; on Free, work from what you have.
4. Write the research:
   - the main findings first;
   - what the sources agree on, and where they differ;
   - what is still open or unclear.
   Name the source and the article for every claim, and add nothing the articles do not say.
5. End with the articles you used, one per line as "title (source)", and offer to save them or, on Plus and Pro, to highlight their key passages.

On the Free plan FeedNest allows 20 tool calls an hour, so keep the whole research under ten calls. If a tool says my plan does not include something, say so plainly and carry on without it.

Write in the language I have been using in this conversation, or in English if there is none.
