# TODO

## Marketplace (!DONT DO THAT YET, THE IDEA IS NOT FINISHED, IGNORE THIS PARAGRAPH!)

- [x] Add a Marketplace for Boards, Pieces and Designs. Some should be free, but also create a buying mockup.
- [ ] Add a way to rate and review the boards, pieces and designs. You should be able to see the average rating and the number of reviews, as well as the reviews of other users.
- [ ] Add a way to search for boards, pieces and designs.
- [ ] Add a way to sort the boards, pieces and designs by rating, number of reviews, price, etc.
- [ ] Add a way to filter the boards, pieces and designs by category, price, etc.
- [ ] Add everything to the database.
- [ ] You should only be able to buy boards, pieces and designs if you are logged in.
- [ ] You should be able to see your purchases in your profile.
- [ ] You should be able to sell your boards, pieces and designs.
- [ ] Take a look at the figma screenshot for the idea and layout.

Okay, that's a big thing. Ummm viewable history. The UI is there, but unfortunately it does not work yet. So nowhere. Yeah, I think I'll implement in the bot editor in the play those yourself feature, but for now, focus on the playing thing in /game for both Stockfish and playing against random players. Matchmaking - please implement viewable history. There should be two ways:

1. The sidebar with moves like a tab, where we can see all of the moves. You should be able to just click on them and then you see the current position that was when this move appeared.
2. Viewing the history by using the standard handle. We've also got this sidebar where we can go back, you can go live, all that.

# Backlog (dont do these!)

1. You should be able to say "and," "or," or "or." Right now, you can only say "this and that," but you should also be able to say "this or that." I don't really understand what you did, so I know you like had Delta, but I'm not good enough at math to know what lines at the left and right line are. I just don't know, so make it understandable for everyone. Don't use these mathematics but use normal language, and then in parentheses you put these mathematics things that are going to display to be displayed when you're just see it, but when you open the options, you get this in normal language. You should also be able to hover it or on mobile touch it, and then there's a tool tip coming on. Oh no, there's coming a model that is then explaining to you what the symbol means.

2. Save the rules to local storage.

3. Now create an implementation plan to implement the logic actually. There should be like an object or function that covers that. First take a look at the /engine. I have written the /engine in a way that it can easily be extended. Just take a look at what could I do, where could I implement the piece editor and make comments. You all over the place make comments and then you also write an implementation plan on what you are actually going to do. The implementation plan should cover following: You create this piece and you can test it out and the engine validates the move. So you create a piece, you say where it can move, and the engine knows where it can move. When you test it out, it validates that move based on the information you gave him if the piece is able to move there or not.

## Report

- [ ] Add a report-feature, where you can report those game during or after a game. It should be sent to a database where I can as admin ban players

## Marketplace (Upcoming)

- [ ] Add a way to rate and review the boards, pieces and designs.
- [ ] Add a way to search/sort/filter.
- [ ] Sell functionality.

1. [x] finish /Editor/Board, the play functionality in the Board Editor and saving things to your account.
2. Create a piece of time with saving things to your account.
3. Implement the piece editor into the PlayVersusYourself functionality
4. Implement playing against others on custom pieces and custom boards.
5. Finish SEO and testing.
6. Launch the site.
