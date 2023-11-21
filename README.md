# Accountabilibuddes


## Development
- Run Postgres through docker-compose.
- Run the node app locally.
- Whatever.


## TODO:
 - DUMB: Drop the "check" field on stat – it's a waste. Replace with value 1/0,
 - The output of the mega-list stats API is massive. Could compress it
   way smaller my reformatting the response to return lists of numbers per-user,
   instead of an object per-stat, with all the associated keys and UUIDs.



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