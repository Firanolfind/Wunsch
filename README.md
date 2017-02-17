# Wunsch
Class with Promise featured methods. Ability to wrapp methods and use async methods in sync way

### How to create

You can create new wunsch object:
```
const Wunsch = require('wunsch-mixin');
const wObj = new Wunsch;
```

Or you can mutate existing object:
```
const Wunsch = require('wunsch-mixin');
const someObj = {};

Wunsch.extend(someObj);
//... do stuff with someObj
```


### Example How to Use
For example we have two async methods.
```
wObj.asyncMethod1 = function(cb){
    if(!cb) return this.promise(this.asyncMethod1);

    setTimeout(()=>{
        console.log('Method 1');
        cb('some args');
    }, 2000);
}

wObj.asyncMethod2 = function(cb){
    if(!cb) return this.promise(this.asyncMethod2);

    setTimeout(()=>{
        console.log('Method 2');
        cb('some args');
    }, 3000);
}
```

Then we want to use them one after another, in right sequence. Also we can handle the end of the sequence by sync method `.then(fn)` or async `.promise(fn)`. To catch error while processing methods, can be provided `.catch(fn)` method.

```
wOjb.asyncMethod1()
    .asyncMethod2()
    .promise(cb=>{
        console.log('Custom Promise');
        setTimeout(cb, 1000);
    })
    .then(()=>{
        console.log('The End!');
    })
    .catch(err=>{
        console.error('Error:', err);
    });

```

Result:
```
Method 1
Method 2
Custom Promise
The End!
```