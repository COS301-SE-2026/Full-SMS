
self.onmessage = async function (e) {
    try{
        const { buffer } = e.data;

        const stream = new Response(buffer).body?.pipeThrough(
            new DecompressionStream('gzip')
        );

        const unzipedResponse = new Response(stream);
        const parsedData = JSON.parse(await unzipedResponse.text())

        self.postMessage({"success": true, "data": parsedData})    
    }
    catch(error: any){
        self.postMessage({"success": false, "error": error.message || error.toString()});
    }

}
