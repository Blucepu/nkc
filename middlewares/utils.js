/**
 * Created by nodefx on 8/29/14.
 */

exports.parseRange = function (str, size) {
  if (str.indexOf(",") !== -1) {
    return;
  }
  if(str.indexOf("=") !== -1){
    str = str.substr(6, str.length)
  }
  const range = str.split("-");
  let start = parseInt(range[0], 10)
  let end = parseInt(range[1], 10) || size - 1

  // Case: -100
  if (isNaN(start)) {
    start = size - end;
    end = size - 1;
    // Case: 100-
  } else if (isNaN(end)) {
    end = size - 1;
  }

  // Invalid
  if (isNaN(start) || isNaN(end) || start > end || end > size) {
    return;
  }
  return {
    start: start,
    end: end
  };
};
