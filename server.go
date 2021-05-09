package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/rs/cors"
)

func main() {
	var smux = http.NewServeMux()

	smux.HandleFunc("/upload", func(w http.ResponseWriter, req *http.Request) {

		req.ParseMultipartForm(10 << 20)

		// Get handler for filename, size and headers
		file, handler, err := req.FormFile("asset")
		if err != nil {
			fmt.Println("Error Retrieving the File")
			fmt.Println(err)
			return
		}

		defer file.Close()
		fmt.Printf("Uploaded File: %+v\n", handler.Filename)
		fmt.Printf("File Size: %+v\n", handler.Size)
		fmt.Printf("MIME Header: %+v\n", handler.Header)

		// Create file
		dst, err := os.Create(fmt.Sprintf("files/%s", handler.Filename))
		defer dst.Close()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Copy the uploaded file to the created file on the filesystem
		if _, err := io.Copy(dst, file); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		for key, value := range req.Form {
			fmt.Printf(" %s = %s", key, value)
		}

		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "Please check the email for code"})
	})

	handler := cors.AllowAll().Handler(smux)
	var server = &http.Server{
		Addr:         ":8081",
		ReadTimeout:  24 * time.Hour,
		WriteTimeout: 24 * time.Hour,
		Handler:      handler,
	}
	server.ListenAndServe()
}
