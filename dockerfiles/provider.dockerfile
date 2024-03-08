FROM scottyhardy/docker-wine:latest
RUN sudo -E bash - && \
    apt-get -y update && apt-get install -y \
         alsa-utils \
         libasound2 \
         psmisc \
         procps pciutils \
         libgstreamer1.0-0 \
	 gstreamer1.0-plugins-base \
	 gstreamer1.0-plugins-good \
	 gstreamer1.0-plugins-bad \
	 gstreamer1.0-plugins-ugly \
	 gstreamer1.0-libav \
	 gstreamer1.0-doc \
	 gstreamer1.0-tools \
	 gstreamer1.0-x \
	 gstreamer1.0-alsa \
	 gstreamer1.0-gl \
         gstreamer1.0-gtk3 \
	 gstreamer1.0-pulseaudio \
         v4l-utils \
         locales 
RUN apt-get install curl gnupg -y
RUN curl -sL https://deb.nodesource.com/setup_18.x | bash - && apt update && apt install -y nodejs
RUN apt install -y libx11-dev libxtst-dev libpng++-dev
RUN useradd wine
USER wine
WORKDIR /home/wine
COPY --chown=wine src/provider/package.json /home/wine/src/provider/package.json
RUN cd src/provider && npm i

COPY --chown=wine fake-home/.wine /home/wine/.wine
COPY --chown=wine entrypoints/provider.sh /usr/bin/entrypoint
COPY --chown=wine src /home/wine/src

ENTRYPOINT ["/usr/bin/entrypoint"]
