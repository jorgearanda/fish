
var request = require('request');


describe('test', function(){
    it("contains spec with an expectation", function() {
        expect(true).toBe(true);
    });

    it("Help", function() {
        request("http://localhost:8080/", function(error, response, body){
            expect(body).not.toBe(null);
            expect(body).toContain(".form-signin");
        });
    });
});