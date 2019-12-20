function find_mode(arr) {
  var max = 0;
  var maxarr = [];
  var counter = [];
  var maxarr = [];

  arr.forEach(function() {
    counter.push(0);
  });

  for (var i = 0; i < arr.length; i++) {
    for (var j = 0; j < arr.length; j++) {
      if (arr[i] == arr[j]) counter[i]++;
    }
  }

  max = arrayMax(counter);

  for (var i = 0; i < arr.length; i++) {
    if (counter[i] == max) maxarr.push(arr[i]);
  }

  var unique = maxarr.filter(onlyUnique);
  return unique;
}

function arrayMax(arr) {
  var len = arr.length,
    max = -Infinity;
  while (len--) {
    if (arr[len] > max) {
      max = arr[len];
    }
  }
  return max;
}

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

testArr1 = ["C", "C", "C"];

testArr2 = ["H", "S", "S"];

testArr3 = ["D", "S", "H"];

console.log(find_mode(testArr1));
console.log(find_mode(testArr2));
console.log(find_mode(testArr3));
