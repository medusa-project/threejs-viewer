function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
}

var modelPath = getQueryVariable('modelPath');
var objFile = getQueryVariable('objFile');
var mtlFile = getQueryVariable('mtlFile');

if (modelPath && objFile && mtlFile) {
    initViewer({
        'containerId': 'viewer-container',
        'modelPath': modelPath,
        'objFile': objFile,
        'mtlFile': mtlFile
    });
}

var dropZone = document.getElementById('drop-zone');

dropZone.addEventListener('dragover', function(e) {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
});

dropZone.addEventListener('drop', function(e) {
    e.stopPropagation();
    e.preventDefault();

    var objFile, mtlFile, modelPath;

    var length = e.dataTransfer.items.length;
    for (var i = 0; i < length; i++) {
        var entry = e.dataTransfer.items[i].webkitGetAsEntry();
        if (entry.isFile) {
            alert('Drop a folder containing an OBJ file.')
        } else if (entry.isDirectory) {
            modelPath = entry.name + '/';
            var dirReader = entry.createReader();

            function toArray(list) {
              return Array.prototype.slice.call(list || [], 0);
            }

            var readEntries = function() {
                dirReader.readEntries(
                    function(results) {
                        results = toArray(results);
                        for (var j = 0; j < results.length; j++) {
                            // If the filename ends with .obj or .OBJ
                            if (results[j].name.match(/\w*.obj\b/i)) {
                                objFile = results[j].name;
                                mtlFile = objFile.slice(0, objFile.length - 4) + '.mtl';
                                var query = 'modelPath=' + modelPath +
                                        '&objFile=' + objFile +
                                        '&mtlFile=' + mtlFile;
                                window.location.search = query
                            }
                        }
                        readEntries();
                    },
                    function(e) {
                        alert(e);
                    }
                );
            };
            readEntries();
        }
    }
});
