---
title: Understanding Express Middleware in Node.js
author: Morgan
date: 2013-07-07 20:57:22
---
Middleware is one of those interesting concepts that once you get it is very helpful. I learned this from making an autominify middleware for express.

The concept goes like this:
Express is initialized. Each time you add an<!-- more --> `app.use` call, it appends it to a list of things to try every time someone requests a file. When a file is requested, each of these is called in turn and, if they don’t care about the request, they call a `next()` function and Express moves onto the next app.use call. If nothing claims the request, a 404 is called.

The syntax is pretty simple, but there’s some useful things I’ve done in autominify that you might want to use, as well.

This is the simplest example of this I could think of. An inline function only executes if helloworld is somewhere in your url. This could be as simple as

```http://localhost:3000?helloworld=true```

and it would produce helloworld as the page.
If you didn’t have helloworld in your url, it would process as normal.

```javascript
app.use(function(req, res, next){
    if(req.url.indexOf('helloworld') != -1){
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('helloworld');
    }
    else
    {
      next();
    }
});
```

Remember that `app.use` executes in order, so if something else handles the request before you do, you’ll never see your code work.

If you’re looking to make a module, here’s the basics you might need.

```javascript
//in app.js
var myModule = require('myModule');
app.use(myModule(true));
//file called myModule.js
module.exports = function (goodbye) {
    var mainText = "hello world";
    if(goodbye)
    {
      mainText = "goodbye world"
    }

	return function (req, res, next) {
		if(req.url.indexOf('helloworld') != -1){
			res.writeHead(200, {'Content-Type': 'text/plain'});
			res.end(mainText);
		}
		else
		{
			next();
		}
	}
}
```

You’ve passed in `true` as an init param. This would mean that all sessions that are handled with this middleware (any request with helloworld in the url) would receive goodbye world as the text on the page.
