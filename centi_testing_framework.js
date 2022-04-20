// Centi Testing Framework 1.0, Jaap Murre, jaap@murre.com, April 2022, MIT License
const report = function(condition,exp,test,assertion,msg,not,contents,some,threw,showexp,arglength) {
  let passed, retval;
  if (threw) {
    condition = test === 'to throw'; // Only PASS, if the intention was 'to throw' (converted from toThrow)
  }
  if (not ? !condition : condition) {
    passed = "    \x1b[42mPASS\x1b[0m  "; // Log 'PASS' with a green background
    ++expect.settings.testgroups[expect.settings.activetestgroup].totalpassed;
    ++expect.settings.testgroups["$$$default$$$"].totalpassed;
    retval = true;
  } else {
    passed = "    \x1b[41mFAIL\x1b[0m  "; // Log 'FAIL' with a red background
    retval = false;
  }
  msg && console.log((!showexp && (passed + "Expect ") || "          ") + msg + (showexp?":":"")); // Show message `msg`; `showexp` is true if `exp` is an (eval'ed) string
  test = test.charAt(0) === '=' && not ? '!' + test.slice(1) : test; // Convert 'not ===' and 'not ==' to '!==' and '!=', resp.
  showexp && console.log(passed + "Expect",(some?"some ":"") + (contents?"contents of ":"") + exp,(not && test.charAt(0) !== '!' ? 'not ' : '') + test,arglength > 1 ? assertion : '');
  ++expect.settings.testgroups[expect.settings.activetestgroup].totaltested;
  ++expect.settings.testgroups["$$$default$$$"].totaltested;
  return retval;
}
const expect = function(exp,msg) { return _expect(exp,msg); }
try { module.exports = expect; } catch {}
expect.settings = {
  tolerance: 0.000001,
  activetestgroup: "$$$default$$$",
  testgroups: { "$$$default$$$": { totaltested: 0, totalpassed: 0 }  }
}
expect.start = function(testgroup) {
  testgroup = testgroup || "$$$default$$$";
  expect.settings.testgroups[testgroup] = {
    totaltested: 0,
    totalpassed: 0
  }
  expect.settings.activetestgroup = testgroup;
  console.log(testgroup === "$$$default$$$" ? "\nRESEST Test Counters" : "\nSTART " + testgroup);
}
expect.end = function(testgroup) {
  testgroup = testgroup || "$$$default$$$";
  expect.settings.activetestgroup = "$$$default$$$";
  console.log((testgroup === "$$$default$$$" ? "\n----------- END TEST ------------\n" : "END " + testgroup));
  console.log("    Passed",expect.settings.testgroups[testgroup].totalpassed,"out of",expect.settings.testgroups[testgroup].totaltested,"tests\n");
}
expect.matchers = {
  "toBe": { fun: (exp,assertion) => assertion === exp, test: "===" } // if no 'test' property, it is generated: toBe -> to be
, "toBeEquivalent": { fun: (exp,assertion) => assertion == exp, test: "==" }
, "toBeExactly": { fun: (exp,assertion) => Object.is(assertion,exp), test: "to be exactly (with Object.is)" }
, "toBeCloseTo": { fun: (exp,assertion) => Math.abs(assertion - exp) < expect.settings.tolerance }
, "toBeGreaterThan":  { fun: (exp,assertion) => exp > assertion }
, "toBeGreaterThanOrEqual":  { fun: (exp,assertion) => exp >= assertion }
, "toBeLessThan":  { fun: (exp,assertion) => exp < assertion }
, "toBeLessThanOrEqual":  { fun: (exp,assertion) => exp <= assertion }
, "toBeTruthy": { fun: (exp) => !!exp === true }
, "toBeFalsy": { fun: (exp) => !exp === true }
, "toBeAnInstanceOf": { fun: (exp,assertion) => exp instanceof assertion }
, "toBeNaN": { fun: (exp) => isNaN(exp), test: "to be NaN (not a number)" }
, "toMatch": { fun: (exp,assertion) => exp.search(assertion) > -1 }
, "toThrow": { fun: () => null } // toThrow is a place-holder function; its logic is handled in _expect() by try...catch eval()
}
function process(fun,exp,assertion,contents,some) {
    if (contents && exp !== undefined && typeof(exp) !== 'string' && typeof(exp) !== 'function' && exp.length ) {
      if (contents && (typeof(assertion) === 'string' || typeof(assertion) === 'function' || !assertion.length)) {
        assertion = new Array(exp.length).fill(assertion);
      }
      if (exp.length !== assertion.length) {
        return false;
      } else {
        let t = !some;
        for (let i = 0; i < exp.length; i++) {
          if (some) {
            t = t || fun(exp[i],assertion[i]); // Test must pass for some elements of an array for a global PASS
            if (t) { return t; }
          } else {
            t = t && fun(exp[i],assertion[i]); // Test must pass for all elements of an array for a global PASS
          }
        }
        return t;
      }
    } else {
      return fun(exp,assertion);
    }
}
expect.wrap = function(f) { // function wrapper
    function mf(...args) { // wrapping function (mf); ...args gives an array, not an old-type arguments structure
        mf.wrap.calls.push(args);
        try {
            if (new.target) { // This detects calls with new
                const r = new f(...args);
                mf.wrap.results.push({ value: r, type: "instance"}); // r is not the return value of f() but a new instance
                mf.wrap.instances.push(r); // Only if called with new an instance is stored
                return r;
            } else {
                const r = f(...args);
                mf.wrap.results.push({ value: r, type: "return"}); // r is the normal return value of f()
                return r;
            }
        } catch (e) { mf.wrap.results.push({ value: e, type: "throw"}); }
    }
    mf.wrap = {
        calls: [],
        results: [],
        instances: []
    }
    return mf;
}
expect.fn = function(){ return expect.wrap(new function(){}); }
const _expect = function(__exp,__msg,__not,__contents,__some,__all) { // __exp: expression or expression string being tested, __msg: message string (optional)
    const obj = {
      "not": !__not && _expect(__exp,__msg,true,__contents,__some,__all)
    , "contents": !__contents && _expect(__exp,__msg,__not,true,__some,__all)
    , "some": !__some && _expect(__exp,__msg,__not,__contents,true,__all)
    , "all": !__all && _expect(__exp,__msg,__not,__contents,__some,true) // all does not do anything because it is implicit
    }
    let __exp__code, __threw = false;
    try {
      __exp__code = eval(__exp);
    } catch (e) {
      __exp__code = e;
      __threw = true;
    }
    for (let k in expect.matchers) {
      let m = expect.matchers[k];
      let test = m.test || k.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase(); // if m.test is not defined: toBeCloseTo -> to be close to
      obj[k] = (assertion) => report(!__threw && process(m.fun,__exp__code,eval(assertion),__contents,__some),
                                        __exp,test,assertion,__msg,__not,__contents,__some,__threw,typeof(__exp) === 'string',m.fun.length);
    }
    return obj;
}
