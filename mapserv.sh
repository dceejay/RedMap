#! /bin/sh
# set this to the path of your WMS map file
MS_MAPFILE=~/Data/Maps/uk.map
#MS_MAPFILE=/tmp/Data/maps/gb.map
export MS_MAPFILE
# and set this to the path of your cgi-mapserv executable
/Library/WebServer/CGI-Executables/mapserv
