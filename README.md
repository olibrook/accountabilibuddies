# Accountabilibuddes


## Development
- Run Postgres through docker-compose.
- Run the node app locally.
- Whatever.


## TODO:
 - Next up: You've fetched users and their tracks on /tracks.
   Now create an API to list a whole batch stats for tracks
   and render those in a crappy spreadsheet view.

   Eg.

   const followingIds = getFollowing().map(user => user.id)
   const stats = listStates(followingIds, start=123, end=456)

   This, with some seed data, is enough to start building
   some UI with.


## 😍Design

![An exquisite app design](./design-goal.png)


## Simple
- Support settings page that allows you to switch
  between imperial and metric units.



### "My Tracks"

- Exactly the same as the Accountabilibuddies
  spreadsheet.
- Includes private tracks

### "Buddies' Tracks"

- Same as "My Tracks", but for a buddy.
- Excludes private tracks

### "Tracks In Common"

- For all of your buddies, find all tracks
  that you have in common.
- Show each track in turn, left-to-right, but
  line up each of your buddies' stats in the same view.

Eg.

   Gym              Alcohol    Weight
   Oli  Mike  Noah  Oli Mike   Oli Mike Noah


### "Single Track"

- Same as "Tracks in Common", but only for single
  track, eg.

   Gym
   Oli  Mike  Noah


## Nice

- Build a UI for mobile, make it nice.
- Private/public tracks and goals.