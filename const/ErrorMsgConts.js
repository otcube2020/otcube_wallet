function define(name, value) {
    Object.defineProperty(exports, name, {
        value: value,
        enumerable : true,
    });
}

define("ERR",
{
"INTERNAL"  : "Internal error"
,"DUPLICATE" : "Invalid wallet E-Mail ID(Duplicate)"
,"SIGNUP"    : "Join member insert error"
});

define("SUCCESS",
{
"SIGNUP"  : "SIGNUP SUCCESS"
});
