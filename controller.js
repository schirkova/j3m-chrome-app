function TodoCtrl($scope) {

	var webview=document.querySelector("webview"); 
	webview.src="https://www.j3m.info";
	
	webview.addEventListener('permissionrequest', function(e) {
	  if (e.permission === 'download') {
	      console.log(e);
	    e.request.allow();
	    downloadFile(e.url);
	  }
	});
	
$scope.chooseDir = function () {
  chrome.fileSystem.chooseEntry({type: 'openDirectory'}, function(theEntry) {
    if (!theEntry) {
      output.textContent = 'No Directory selected.';
      return;
    }
    // use local storage to retain access to this file
    chrome.storage.local.set({'chosenFile': chrome.fileSystem.retainEntry(theEntry)});
    initTimeline();
    loadDirEntry(theEntry);
  });
};
	   
$scope.chooseFile = function () {
	  var accepts = [{
	    mimeTypes: ['text/*'],
	    extensions: ['j3m', 'json']
	  }];
  	chrome.fileSystem.chooseEntry({type: 'openFile', accepts: accepts}, function(theEntry) {
	    if (!theEntry) {
	      output.textContent = 'No file selected.';
	      return;
	    }
	    // use local storage to retain access to this file
	    chrome.storage.local.set({'chosenFile': chrome.fileSystem.retainEntry(theEntry)});
	    $('#save_csv').disabled = false;
	    $('#save_tsv').disabled = false;
	    $('#save_html').disabled = false;
	    $('#save_csv').css("background-color","#e5eef3");
	    $('#save_tsv').css("background-color","#e5eef3");
	    $('#save_html').css("background-color","#e5eef3");
	    loadFileEntry(theEntry);
  });
};    

 

function loadFileEntry(_chosenEntry) {
  chosenEntry = _chosenEntry;
  chrome.fileSystem.getDisplayPath(chosenEntry, function(path) {
        $scope.$apply(function() {
      		$scope.filePath = path;
   		});
    });

  readAsText(chosenEntry, displayJ3m);
}


function readAsText(fileEntry, callback) {
  fileEntry.file(function(file) {
    var reader = new FileReader();

    reader.onerror = errorHandler;
    reader.onload = function(e) {
      callback(e.target.result);
    };

    reader.readAsText(file);
  });
}

function displayJ3m(data) {
   var j3mObject = JSON.parse(data);

	var jsonData = {"d3DisplayName" : "j3m : ", "children" :convertToTree(j3mObject)};
	initTree(jsonData);
	$scope.j3m = j3mObject;
} 

function downloadFile(url) {
    var xhr = new XMLHttpRequest(); 
    xhr.open('GET', url, true); 
    xhr.responseType = "blob";
    xhr.onreadystatechange = function () { 
        if (xhr.readyState == 4) {
            var fileName = getFileName(url,xhr.response.type); 
        	saveFile(xhr.response, fileName);
        }
    };
    xhr.send(null);
}

function getFileName(url,type){

	var name = url.split("/")[4];
	if (type === "image/jpeg"){
		return name.concat(".jpeg");
	}else if  (type === "text/html"){
		return name.concat(".j3m");
	}else if (type === "video/x-matroska"){
		return name.concat(".mkv");
	}else {
		console.log("unknown file type" + type);
	}
	
}

$scope.saveCSV = function () {
	if ($scope.j3m){
		var fileName = $scope.j3m.asset_path.split("/")[1];
		var blob = new Blob([toCSV($scope.j3m)], {type: 'text/plain'});
		saveFile(blob, fileName + ".csv");
	}
}
$scope.saveTSV = function () {
	if ($scope.j3m){
		var fileName = $scope.j3m.asset_path.split("/")[1];
		var blob = new Blob([toTSV($scope.j3m)], {type: 'text/plain'});
		saveFile(blob, fileName + ".tsv");
	}
}
$scope.saveHTML = function () {
	if ($scope.j3m){
		var fileName = $scope.j3m.asset_path.split("/")[1];
		var blob = new Blob([toHTML($scope.j3m)], {type: 'text/plain'});
		saveFile(blob, fileName + ".htm");
	}
}

function saveFile(data, name) {
    console.log(data);
    
    chrome.fileSystem.chooseEntry({type: 'saveFile', suggestedName : name }, function(entry) {
    if (chrome.runtime.lastError) {
      errorHandler(chrome.runtime.lastError.message);
    }
    saveToEntry(entry, data);
  });
}

function saveToEntry(fileEntry, blob) {
  fileEntry.createWriter(function(fileWriter) {
    fileWriter.onwriteend = function(e) {
      if (this.error)
        errorHandler('Error during write: ' + this.error.toString());
    };

    fileWriter.write(blob);
  });
}
var output = document.querySelector('output');
var textarea = document.querySelector('textarea');


// for directories, read the contents of the top-level directory (ignore sub-dirs)
// and put the results into the textarea, then disable the Save As button
function loadDirEntry(_chosenEntry) {
  chosenEntry = _chosenEntry;
  if (chosenEntry.isDirectory) {
  	  chrome.fileSystem.getDisplayPath(chosenEntry, function(path) {
        $scope.$apply(function() {
      		$scope.dirPath = path;
   		});
    });
    
    var dirReader = chosenEntry.createReader();
    var entries = [];

    // Call the reader.readEntries() until no more results are returned.
    var readEntries = function() {
       dirReader.readEntries (function(results) {
        if (!results.length) {
          textarea.value = entries.join("\n");
        } 
        else {
          results.forEach(function(item) { 
          	if (item.fullPath.match(/.j3m$/)) { 
            	entries = entries.concat(item.fullPath);
            	  readAsText(item, addJ3M);
            }
          });
          readEntries();
        }
      }, errorHandler);
    };

    readEntries(); // Start reading dirs.    
  }
}



function convertTimestamp(timestampField) {
    var timestampValue = parseInt(timestampField);
    if(isNaN(timestampValue) || timestampValue != timestampField) {
        return "N/A";
    }
    else {
        var dt = new Date(timestampValue*1000);
        console.log(dt.getFullYear() + '-' + pad(dt.getMonth()+1, 2) + '-' + pad(dt.getDate(), 2) + ' ' + pad(dt.getHours(), 2) + ':' + pad(dt.getMinutes(), 2) + ':' + pad(dt.getSeconds(), 2));
        console.log(dt.toLocaleString());
        console.log(dt.toUTCString());
        return dt.toLocaleString();
    }
}
function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function errorHandler(e) {
  console.error(e);
}

}

