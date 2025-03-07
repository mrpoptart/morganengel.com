---
title: Vue.js CLI 3 API URL Environment Variables
author: Morgan
photos: /img/vue/image.png
date: 2020-11-24
---
I recently converted a project to use vue cli version 3. This change has helped with consistency across my app, but a few things that used to work don't anymore. Specifically, the API urls I used to include in my webpack js are no longer updating during the production build. Here's how I fixed that<!-- more -->.

[This link](https://web.archive.org/web/20240717130234/https://cli.vuejs.org/guide/mode-and-env.html?ref=morganengel.com#using-env-variables-in-client-side-code) gave me the final key I needed. I tried a lot of things like Webpack definePlugin as well as env.local. By specifying the env variable in the vue.config.js file, it's able to include the content both in the dev server and the production build.

```javascript
if (process.env.NODE_ENV === 'production') {
  process.env.VUE_APP_API_URL = 'https://myprodlink.com'
} else {
  process.env.VUE_APP_API_URL = 'http://localhost:5001/mydevlink'
}

module.exports = {
  css: {
    loaderOptions: {
      sass: {
        prependData: `@import "~@/style/_variables.scss";`
      }
    }
  },
}
```
You'll have to restart your dev server for changes in this file to be picked up, but once it started working, it included the correct URL in both production and dev.