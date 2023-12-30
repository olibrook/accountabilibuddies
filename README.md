# Accountabilibuddes


## Development
- Run Postgres through docker-compose.
- Run the node app locally.
- Whatever.



## MVP

### TODO

- Setup Postgres, get used to doing migrations.
  - Part done: Created an instance
- Missing CRUD for stats.
- Missing ability to add/remove followers in-app.
- Replace Github with Google Login.
- Persist user prefs (imperial, etc.)

### DONE

- Finish Porkbun and Google Domain setup (https://console.cloud.google.com/run/domains?hl=en&project=accountabilibuddies-409618)
  - Part done: Waiting for Google to detect the DNS settings on Porkbun.


















## TODO:
 - Make a Venn diagram of you and your buddies and the
   tracks you have in common!!
 - Whoops – private tracks. Don't show these!



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