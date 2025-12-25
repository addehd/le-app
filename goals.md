In this app, you will be able to log in using Supabase authentication. 
This is to be able to share some links with a partner or some friends. 
It could be a small group or two (usually two persons) so they are able to log in and they can
share data to each other.

At the beginning, let's start witht the beginning, let's start with just pasting URLs. When we pasted a URL, we checked the response for the OG titles and have them saved in a list (small image). On the right side, the URL that is shortened by a, and of course if you full URL can be there, but otherwise that that that that and some info from the og titles. You can share this with some friend, so maybe search other friends by name or by nickname. 
Got it! So you want **private shared spaces** where only specific people can see the links.

**Updated plan:**
1. Supabase login/auth
2. Create **shared spaces** (e.g. "My Partner", "Travel Buddies")
3. Invite specific friends to each space (by username/nickname)
4. Paste URLs in a space → fetch OG metadata
5. Only members of that space see those links

**Data structure:**
- Spaces (with members list)
- Links (belong to a space)
- Users can be in multiple spaces

Should I start building this now?

