const objectToString =  (obj) => {
    // Get an array of the object's values
    let values = Object.values(obj);
    // Map each value to a string, using quotes if it is not an integer
    let strings = values.map(value => {
        // Check if the value contains only integer digits
        if (/^\d+$/.test(value)) {
            // If so, return it as a string without quotes
            return parseInt(value);
        } else {
            // Otherwise, return it as a string with quotes
            return `"${value}"`;
        }
    });
    // Join the strings with commas and add parentheses
    return `(${strings.join(", ")})`;
}

module.exports = { objectToString };