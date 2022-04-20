// Use this with Node.js. Type: node index.js

const expect = require("./centi_testing_framework");

add = function(a, b) { return a + b; } 
function subtract(a,b) { return a-b; } 

expect.settings.testonly = "Array tests";

console.log("\nTESTS\n");
// There are two ways to use this: (1) the traditional way:
expect(subtract(1,2),"subtract 1 from 2 to equal -1").toBe(-1); // You can use the expressions directly but then you *must* then add a message
// or (2) in the short-hand way:
expect("add(1,2)").toBe("3"); // You can add the expressions as strings, which will then automatically be eval'ed and reported
expect("add(1,2)").toBe("3.000001"); // No message is necessary; it will be auto-generated; This test is expected to FAIL
expect("add(1,2)").not.toBe("3.0000001");
expect("add(1,2)").toBeCloseTo("3.0000001");
expect("add(1,2)").not.toBeCloseTo("3.0000001");
expect(subtract(-4,-2),"this to FAIL").toBe("-6");
expect("add(0,0)").toBeExactly("+0");
expect("add(-0,-0)").toBeExactly("+0");
expect("add(-0,-0)").not.toBeExactly("+0");
expect("add(-4,-2)","Adding negative numbers").toBe("-6"); // You can (optionally) add a message if you wish

expect.start("Truthy and falsy tests");
expect("add(1,1)").toBeTruthy();
expect("add(1,-1)").toBeFalsy();
expect.end("Truthy and falsy tests");

expect.start("Array tests");
expect("[1,2]").contents.toBe("[1,2] "); // By default all pairs of elements must fit the test function (here toBe)
expect("[10,20]").contents.toBeCloseTo("[10.00000001,20.00000001]");
expect("[100,200]").not.contents.toBeCloseTo("[10.00000001,20.00000001]"); // not works too
expect("[100,200]").contents.not.toBeCloseTo("[10.00000001,20.00000001]"); // the order of not is free, but you cannot use not twice
expect([10,20],"two arrays to be close enough").contents.toBeCloseTo([10.00000001,20.00000001]); // You must provide your own message when not using a string
expect("[1,2,3,4,5]").contents.toBe("[1,1,1,1,1] "); // Fails
expect("[1,2,3,4,5]").some.contents.toBe("[1,1,1,1,1] "); // Adding some to contents allows PASS on a single passed test
expect("[2,2,3,4,5]").some.contents.toBe("[1,1,1,1,1] "); // Fails because no tests passes
expect("[1,2,3,4,5]").some.contents.toBe("1"); // Each element of the array is compared to the number 1 (you cannot have two or more though)
expect("[1,2,3,4,5]").some.contents.not.toBe("1");  // Fails because it has not
expect("[1,2,3,4,5]").contents.toBe("1"); // Fails because 'all' is implicit
expect("[1,2,3,4,5]").contents.toBe("1"); // Fails because 'all' is implicit
expect("[1,1,1,1,1]").all.contents.toBe("1"); 
expect.end("Array tests");

expect.start("Custom matcher tests");
expect.matchers["toBeWithin"] = { fun: (exp,assertion) => exp > assertion[0] && exp < assertion[1] }
expect("add(1,3)").toBeWithin("[2.5,5]");
expect("add(1,3)").toBeWithin("[12.5,25]"); // Fails
expect("[13,14,15,16]").contents.toBeWithin("[12.5,25]"); // Fails

expect.matchers["toBeWithin"] = { fun: (exp,assertion) => exp > assertion.min && exp < assertion.max }
expect("[13,14,15,16]").contents.toBeWithin("({min:12.5,max:25})"); // Passes

expect.matchers["toBeWithin"] = { fun: (exp,assertion) => exp > Number(assertion.split(',')[0]) && exp < Number(assertion.split(',')[1]) }
expect("[13,14,15,16]").contents.toBeWithin("'12.5,25'"); // Passes

expect.matchers["toHaveLength"] = { fun: (exp,assertion) => exp.length === assertion }
expect("[13,14,15,16]").toHaveLength("4"); // Passes
expect("[[1,2],[3,4]]").contents.toHaveLength("2") // Passes

expect.matchers["toHaveLength"] = { fun: (exp,assertion) => exp.length === assertion, test: "to be of length" }
expect("[13,14,15,16]").toHaveLength("4"); // Passes

expect.end("Custom matcher tests");

expect.start("Object matching tests");
//expect.context.house = { // Adding to the context is only required when working with Node.js
house = { // Adding to the context is only required when working with Node.js
    bath: true,
    bedrooms: 4,
    kitchen: {
        area: 20
    }
}
expect("house.bath").toBeTruthy();
expect("house.bath").not.toBe(undefined);
expect("house.pool").toBe(undefined);
expect("house.kitchen.area").toBeGreaterThan(15);
expect.end("Object matching tests");

expect("NaN").toBeNaN();
expect("undefined").toBeNaN();

expect("[1,2,3]").toBeAnInstanceOf("Array");

expect.start("Wrap functions");
// Using a Jest-like mock function fn()

fn = expect.fn();
[1,2,3,4].forEach(fn);
expect("fn.wrap.calls.length").toBe(4); 

function f(value) { // Test function
    if (value === 2) {
        throw "I don't like 2!";
    }
    this.name = "Jantje" + value;
    return value;
}

ff = expect.wrap(f); // Use (implicit) assignment to global (no const or let) to use short-hand notation below

[1,2,3,4].forEach(ff);

const x = new ff(1);
const y = new ff(3);
const z = new ff(2);

// Now ff.wrap contains info about the function calls that can be read out and possibly be used in tests
console.debug("wrap: ",ff.wrap);
// E.g.,
expect("ff.wrap.calls.length").toBe(7); // This shows in the console window
// does not work on Node.js because ff is not in the expect.context: use `expect.context.ff = wrap(f)` for that

console.info(ff.wrap.instances[0] === x); // true
console.info(ff.wrap.instances[1] === y); // true

expect.end("Wrap functions");

expect("adding(1,2)").toThrow(); // because this function does not exist; this should Pass
expect("adding(1,2)").not.toThrow(); // this should Fail
expect("add(1,2)").not.toThrow(); // this should Pass

expect.end();
