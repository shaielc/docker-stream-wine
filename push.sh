docker tag heroes3:latest bouncer582/private:heroes3-latest
docker tag private-streamer:latest bouncer582/private:streamer-client
docker push bouncer582/private:streamer-client
docker push bouncer582/private:heroes3-latest

