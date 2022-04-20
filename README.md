CentiTF (Centi Testing Framework)
=================================

Jaap Murre, 2022, jaap@murre.com

Version: 1.0

License: MIT


# Introduction

I have been a happy user of the Jest Testing Framework for a while now. As an intellectual exercise, I was wondering whether it is possible to create a much smaller framework that uses less verbose testing code, fewer functions, while still covering most useful test cases. This would make it easier to learn and quicker to set-up and use.

Often, software projects are quite small. In such cases, learning and setting up Jest or another framework may seem like overkill for many programmers. This means that testing is conveniently 'forgotten', to the detriment of the quality of the code base.

My objectives were the following:

 - Each test is a short single line **without repetition**
    - Specifically we want to avoid having to write "Add 1 + 2", which would then also followed by a function call like `add(1+2)` (i.e., when testing a hypothetical `add()` function)
    - The code in CentiTF is just: **expect("add(1,2)").toBe("3")**
 - Have an extremely small code base: the entire framework is just single file, which currently is less than 130 lines of code (6.4kB unzipped or 2.3kB zipped)
 - Can be used both in NodeJS and in the browser
 - Include a small but powerful set of out-the-box matcher tests, covering many practical use-cases
 - Make it easily extendable with custom matcher tests, where CamelCase test names are automatically converted to output text (e.g., a test called `toBeAPrimeNumber()` would be output as 'to be a prime number')
 - Have default support for both normal and typed arrays, also for newly added custom matchers without writing extra code
 - Support reporting groups of tests with subheaders and subtotals
 - Can be used in either string-based (`eval`'d) mode or a verbose mode, where messages are provided explicitly by the test author

I committed the following sin while writing this framework:

 - To avoid having to first write function calls and then also describing them, I use `eval()` a lot
 - I know


# Usage

## Setup

To use CentiTF in NodeJS, `require` it like this:

    const expect = require("./centi_testing_framework");

In the browser do:

```
    <script src="../centi_testing_framework.js"></script>
```

and `expect` will be available after that.

Both in the NodeJS and in the browser, you must of course first determine and then use the correct path to the CentiTS file!

Output will be sent to the console by default. When using CentiTS in the browser, report output can be redirected to the webpage with a bridging function (see below and the 'index.html' file in the root for an example).

To try out CentiTF, we assume that you want to test the following two functions:

    add = function(a, b) { return a + b; }
    function subtract(a,b) { return a - b; }

Note that when testing in NodeJS, you must use the former format, which implicitly adds `add()` to the global object in
NodeJS. Using `function add(){}` will not work, as it will remain in local scope and will not be accessible when `eval`'d.
You can also make global assignment explicit:

    global.add = function(a, b) { return a + b; }

If a function `myfun` has already been defined, you can at the beginning of the Centi TS test file write:

    global.myfun = myfun;

This will add the function to the global domain just for the duration of the testing. There is no need to do this for functions
that will only run in the browser, where all functions are global by default.


## Writing tests

An example test:

    expect("add(1,2)").toBe("3");

Because the code is specified as strings, which are than `eval`'d, it is not necessary to provide any additional description.
The response for this test is (with PASS in green):

    PASS  Expect add(1,2) === 3

Because `subtract()` is *not* in the global scope, its usage cannot be specified in a string when you are using NodeJS
(though it still works in the browser). The reason is that a NodeJS module has no access to the scope in which the function is defined. Adding it to the global scope remedies this. We can still write it as normal code, but this means that the system cannot discover the exact code of the call. The user must, therefore, provide an explicit message, like in Jest or other frameworks. For example, this will work (and pass):

    expect(subtract(1,2),"subtract 1 from 2 to equal -1").toBe(-1);

which gives:

    PASS  Expect subtract 1 from 2 to equal -1

The philosophy of CentiTF, however, is to make use of test code *strings* as much as possible for the generation of test results.
Hence, we rely on `eval()` and the global scoe to interpret code and use the `eval`'d code strings for output messages.

If desired, it is possible to add a message also to a string-based test, which is then shown above in the output:

    expect("add(-4,-2)","Adding negative numbers").toBe("-6");

which outputs:

          Adding negative numbers:
    PASS  Expect add(-4,-2) === -6

If you are using the string-based representation, it is necessary to use extra quotes so that the string is not `eval`'d.

    expect("'Hello' + ' ' + 'World'").toBe("'Hello World'");

Without the single quotes, this test would fail.


## Matchers

The framework includes a small number of matchers. In these the `exp` variable is the expression that we expect to have
a certain value (i.e., the *assertion*). So `add(1,1)` is the expression `exp`, of which we expect its value to be 2, where
we call 'to be 2' the assertion (i.e., the thing we want assert is true). To test for this we would write (note the quotes!):

	expect('add(1,1)').toBe('2');

This would generate the following line of output (where PASS has a green background):

	PASS   Expect add(1,1) === 2


The following tests are included by default:

 - **toBe**: Uses and reports the === operator for comparison
 - **toBeEquivalent**: Uses and reports the == operator for comparison
 - **toBeExactly**: Uses `Object.is()` for comparison
 - **toBeCloseTo**: Uses `Math.abs(assertion - exp)` < `expect.settings.tolerance` for comparison, where tolerance is 0.000001
   by default. It is settable to another value like this: `expect.settings.tolerance = 0.05`.
 - **toBeGreaterThan**:  Uses and reports the > operator for comparison
 - **toBeGreaterThanOrEqual**:  Uses and reports the >= operator for comparison
 - **toBeLessThan**:  Uses and reports the < operator for comparison
 - **toBeLessThanOrEqual**:  Uses and reports the <= operator for comparison
 - **toBeTruthy**: Uses `!!exp === true` to test
 - **toBeFalsy**: Uses `!exp === true` to test
 - **toBeAnInstanceOf**: Uses `exp instanceof assertion` to test
 - **toBeNaN**: Uses `isNaN(exp)` to test
 - **toMatch**: Uses `exp.search(assertion)` to test, where `assertion` can be either a string or a regular expression
 - **toThrow**: Is true when `exp` throws an error

Note that toBeTruthy() can also easily be achieved with the toBe() function:

    expect("add(1,1)").toBeTruthy();

is equivalent to writing

    expect("!!add(1,1)").toBe("true");

But we kept it anyway because it seems more expressive, conveying more clearly what it is that is being tested.

For other things like string or array length, however, we opted not to include special-purpose matchers, because it is both
easy and expressive to write:

    expect("'Hello'.length").toBe("5");

making an additional matcher unnecessary or even undesirable (more stuff to look up and remember!):

    expect("'Hello'").toHaveLength("5"); // This matcher is not included!

You can easily include this matcher yourself, if you insist on having it. See below.

All of the above matchers may be negated by including .not, e.g.,

    expect("resultString").not.toBe("'error'");

You should insert `.not` only once; the second time it is ignored.


## Automatic support of arrays

The matchers above, as well as any custom matchers you might add, will automatically support array-based comparison, where array is anything with a length property that is not a string or function. This means that TypedArrays are supported too. To communicate to the framework that you want the matcher to be applied to all elements on a element-by-element basis, use the `.contents` property.

The following tests are useful when working with 32bit floating-point calculations and would pass:

    expect("[10,20]").contents.toBeCloseTo("[10.00000001,20.00000001]");
    expect("[100,200]").not.contents.toBeCloseTo("[10.00000001,20.00000001]");
    expect("[100,200]").contents.not.toBeCloseTo("[10.00000001,20.00000001]");

As you can see, the order of the `.not` and `.contents` is free.

By default, all paired tests must pass in order for the whole test to pass. That is, there is an implied `.all` property. You may add it for clarity in the test but it is ignored in processing and reporting:

    expect("[10,20]").all.contents.toBeCloseTo("[10.00000001,20.00000001]");

If it suffices that just one or several of the tests pass, you can use the `.some` property. The tests are still
done in a paired manner, so you must provide two arrays of equal length (else it will fail):

    expect("[1,2,3,4,5]").contents.toBe("[1,1,1,1,1]"); // Fails
    expect("[1,2,3,4,5]").some.contents.toBe("[1,1,1,1,1]"); // Passes
    expect("[2,2,3,4,5]").some.contents.toBe("[1,1,1,1,1]"); // Fails because no tests passes

Because there are many use cases where we are looking for a single needle in a haystack, we can also write

    expect("[1,2,3,4,5]").some.contents.toBe("1"); // Passes

Note that we are comparing an array `[1,2,3,4,5]` with a non-array `1` (but still provided as a string).

This usage of `.some` covers most of the array-contains cases, which do not need to be added separately.

Using a single element for comparison also works with the implied `.all`:

    expect("[1,1,1,1,1]").all.contents.toBe("1"); // Passes
    expect("[1,1,1,1,1]").contents.toBe("1"); // Passes

We can combine `.some` with `.not` and `.contents`:

    expect("[1,2,3,4,5]").some.contents.not.toBe("1");  // Fails

The case where we have an array of comparison values is currently not supported. In case we have two arrays of unequal
length the array comparison will always fail:

    expect("[1,2,3,4,5]").some.contents.toBe("[1,3]");  // Fails

This may be remedied in the future.


## Objects

Matching objects has less support at the moment and must be written out in more detail. Because of the terse nature of the tests, this may still be convenient enough. Suppose, for example, we have object:

    house = { // If you use const or let in NodeJS, assign to global scope before running tests
        bath: true,
        bedrooms: 4,
        kitchen: {
            area: 20
        }
    }

We may then have the following tests (i.e., how I would like my house to be):

    expect("house.bath").toBeTruthy(); // Want a bath
    expect("house.bath").not.toBe(undefined);
    expect("house.pool").toBe(undefined); // Do not want a pool
    expect("house.kitchen.area").toBeGreaterThan(15);

All four tests pass and show some of the possibilities.


## Custom matchers

New matchers can be added directly to the `expect.matchers` object. They consist of an object with at the very least
the test function `fun`. For example:

`expect.matchers["toBeWithin"] = { fun: (exp,range) => exp > range[0] && exp < range[1] }`

    expect("add(1,3)").toBeWithin("[2.5,5]");
    expect("add(1,3)").toBeWithin("[12.5,25]"); // Fails

The output is:

    PASS  Expect add(1,3) to be within [2.5,5]
    FAIL  Expect add(1,3) to be within [12.5,25]

Because we chose to provide the arguments to the assertion as an array, this matcher cannot be combined with an array, because comparing arrays of different lengths will fail:

    expect("[13,14,15]").toBeWithin("[12.5,25]"); // Fails

We can rewrite the matcher and use an object instead:

`expect.matchers["toBeWithin"] = { fun: (exp,assertion) => exp > assertion.min && exp < assertion.max }`

    expect("[13,14,15,16]").contents.toBeWithin("({min:12.5,max:25})"); // Passes

A tricky point here is that whenever you specifiy an object literal like here to be `eval`'d, you must wrap it in round brackets, or else `eval()` will think it is a code block and choke. Another option is to use a string:

`expect.matchers["toBeWithin"] = { fun: (exp,assertion) =`>` exp `>` assertion.split(',')[0] `&&` exp `<` assertion.split(',')[1] }`

    expect("[13,14,15,16]").contents.toBeWithin("'12.5,25'"); // Passes

This works and gives a useful output:

    PASS  Expect contents of [13,14,15,16] to be within '12.5,25'

With matchers that take only a simple argument, this is more straightforward:

`expect.matchers["toHaveLength"] = { fun: (exp,assertion) =`>` exp.length === assertion }`

    expect("[13,14,15,16]").toHaveLength("4"); // Passes

Notice that we have dropped the `.contents` from the test because we are testing an array-level property. This gives output:

    PASS  Expect [13,14,15,16] to have length 4

We can now also test an array of arrays:

    expect("[[1,2],[3,4]]").contents.toHaveLength("2") // Passes

with output:

    PASS  Expect contents of [[1,2],[3,4]] to have length 2

If you do not like how CentiTF transforms the test name 'toHaveLength' into a reported test phrase, you can add your own report phrase by specifying the `.test` property (which is optional). For example:

`expect.matchers["toHaveLength"] ={ fun: (exp,assertion) =`>` exp.length === assertion, test: "to be of length" }`

Now

    expect("[13,14,15,16]").toHaveLength("4"); // Passes

will give output:

    PASS  Expect [13,14,15,16] to be of length 4

But we could have achieved the same by naming the matcher 'toBeOfLength' as the camel-case conversion would transfer this to 'to be of length'.

## Test Groups

By writing

    expect.end()

a summary is output, such as:

    ----------- END TEST ------------

        Passed 40 out of 55 tests

(It is not necessary to write `expect.start()` at the beginning; this is implied.)

You can also precede a number of tests with:

    expect.start("Array tests");

This will output:

    START Array tests

then you could have, say, 13 array tests and then end with:

    expect.end("Array tests");

This will then output a test-group-based summary, while still also counting total passes and total tests:

    END Array tests
        Passed 8 out of 13 tests

Using `expect.start()` without arguments, will reset the global counters of passes and total tested and output a reset
message.


## Usage in the browser

If you want to make use of testing on a webpage, this will work fine if you open the console (with F12 on Windows); you
can then inspect the messages: By default, browser-based testing is output to the console.

If you want, you can also redirect the console.log function to the webpage itself as follows:

    <!DOCTYPE html>
    <html>
    <head>
    <title>Centi Testing Framework</title>

    </head>
    <body>
    <h1>Testing the Centi Testing Framework</h1>
    <pre id="mylog" style="font-size:1.2em;"></pre>


    <script>

        const originalConsoleLog = console.log;
        console.log = (...args) => {
            let s = "<b>";
            args.map(arg => s += arg + " ");
            s = s.replace("\x1b[42m","<span style='background-color:lightgreen;'>");
            s = s.replace("\x1b[41m","<span style='background-color:#fbb;'>");
            s = s.replace("\x1b[0m","</span>");
            s = s.replace(/\n/g,"<br />");
            document.querySelector("#mylog").innerHTML += s + "</b><br />";
        }

        // Here will be all your scripts

        console.log = originalConsoleLog; // Redirect console.log to the original one

    </script>

    </body>
    </html>

The output of console.log is written to a pre-element so that the layout (based on spaces) is preserved. The `console.log()` escape codes for color are converted to styles and the newline symbol `\n` to the br-element (break). An example of this can be found in the 'index.html' file in the root.

If you still need to write to the actual console but cannot because `console.log()` has been redirected you may consider using `console.debug()` (or `console.info()`), which still works as usual and is identical to `console.log()`.


## Included example

You can run the included example file 'index.js' with NodeJS like this in the command-line interface:

    node index.js

It will then produce the console.log message.

Or you can simply click on the example 'index.html' file and inspected it in the browser.


## wrap functions

Inspired by Jest, we provide a mock function `fn()` (though a bit more limited than in Jest):

    fn = expect.fn();
    [1,2,3,4].forEach(fn);

Now, `forEach()` will have been called 4 times:

    expect("fn.wrap.calls.length").toBe(4);

Below, we explain how this works. A more general approach is by using a `wrap` function wrapper, which adds testing functionality to an existing function. Suppose we have a function:

    function f(value) { // Test function
        if (value === 2) {
            throw "I don't like 2!";
        }
        this.name = "Jantje" + value;
        return value;
    }

and we want to test this function during various types of usage. We wrap the function like this:

    ff = expect.wrap(f);

Again, for NodeJS we use (implicit) assignment to global (i.e., no const or let) to enable us to use short-hand notation below. Now, suppose we call the wrapped function with an array forEach:

    [1,2,3,4].forEach(ff);

We want to test that `ff()` has indeed been called four times. We can test this with:

    expect("ff.wrap.calls.length").toBe(4);

Here, 'wrap' is an object that contains three properties:

 - `calls`: an array where each element contains an array with the arguments with which `ff()`, and hence `f()`, was called.

 - `results`: an array with for each call, an object with in the `value` property the result returned by the `ff()` and
   in the `type` property a string, which can take the following values:

    - return: normal return
    - instance: instance created with new operator
    - throw: the function threw an error (the value now contains the error thrown)
<br />
 - `instances`: an array with the 'this' property of each instance created by calling the function with the new operator
   (if the instantation failed and threw an error, nothing is added)

As an example, we assume that the following additional instances are created (in addition to the forEach calls):

    const x = new ff(1);
    const y = new ff(3);
    const z = new ff(2);

then the resulting `wrap` property (i.e., `ff.wrap`) will contain the following information:

    wrap:  {
      calls:
       [ [ 1, 0, [Array] ],
         [ 2, 1, [Array] ],
         [ 3, 2, [Array] ],
         [ 4, 3, [Array] ],
         [ 1 ],
         [ 3 ],
         [ 2 ] ],
      results:
       [ { value: 1, type: 'return' },
         { value: 'I don\'t like 2!', type: 'throw' },
         { value: 3, type: 'return' },
         { value: 4, type: 'return' },
         { value: [f], type: 'instance' },
         { value: [f], type: 'instance' },
         { value: 'I don\'t like 2!', type: 'throw' } ],
      instances: [ f { name: 'Jantje1' }, f { name: 'Jantje3' } ]
    }

Because we have now called `ff()` seven times, we expect the following test to pass:

    expect("ff.wrap.calls.length").toBe(7);
