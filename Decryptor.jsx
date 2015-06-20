Decryptor = {
    isDecrypting: false,
    // Decrypt file using worker.
    // fileMeta needs a fileName and a contentType
    decrypt(file, fileMeta, passphrase, callback) {
        this.isDecrypting = true;
        var workers = window.secureShared.spawnWorkers(window.secureShared
                .workerCount),
            i;
        for (i = 0; i < workers.length; i++) {
            workers[i].addEventListener('message', onWorkerMessage,
                false);
        }

        var slices = file.split(window.secureShared.chunkDelimiter);

        // Send slices to workers
        for (i = 0; i < slices.length; i++) {
            workers[i % workers.length].postMessage({
                fileData: slices[i],
                fileName: i === 0 ? fileMeta.fileName : '', // only send this once
                passphrase: passphrase,
                decrypt: true,
                index: i
            });
        }

        var decryptedFile = {
            fileData: []
        };
        var receivedCount = 0;

        function onWorkerMessage(e) {
            // got a slice. Process it.
            if (!_.isObject(e.data)) {
                // error message
                window.alert("Incorrect password. Refresh this page to try again.");
                return;
            }
            receivedCount++;
            onSliceReceived(e.data);

            if (receivedCount === slices.length) {
                // last slice, finalize
                onFinish();
            }
        }

        function onSliceReceived(slice) {
            if (slice.fileName) decryptedFile.fileName = slice.fileName;
            decryptedFile.fileData[slice.index] = slice.fileData;
        }

        function onFinish() {
            // Create blob
            var binaryData = decryptedFile.fileData.join("");
            var blob = new Blob([window.secureShared.str2ab(binaryData)], {
                type: fileMeta.contentType
            });

            if (!/Safari/i.test(window.BrowserDetect.browser)) {
                var URL = window.URL || window.webkitURL;
                var url = URL.createObjectURL(blob);

                callback(url);

                $("<a>").attr("href", url).attr("download",
                        decryptedFile.fileName).addClass(
                        "btn btn-success")
                    .html(
                        '<i class="icon-download-alt icon-white"></i> Download'
                    ).appendTo("#downloaded-content").hide().fadeIn();
            } else {
                // Safari can't open blobs, create a data URI
                // This will fail if the file is greater than ~200KB or so
                // TODO figure out what's wrong with the blob size in safari
                // TODO Why doesn't safari want a dataview here?
                if (blob.size > 200000) return window.alert(
                    "Sorry, this file is too big for Safari. Please try to open it in Chrome."
                );
                var fileReader = new FileReader();
                fileReader.readAsDataURL(blob);
            }

            this.isDecrypting = false;
        }
    }
};
