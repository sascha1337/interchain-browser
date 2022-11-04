# Hybrid Browser
a web browser for all of us

<p align="center" style="float: right">
	<img src="./build/icon.png" width="333px">
</p>

Hybrid is a p2p browser. it supports the following networks and protocols:

bittorrent<br>
ipfs<br>
hyper<br>
tor<br>
gemini<br>
gopher<br>

It means you will be able to interact with p2p networks and view the p2p data on the browser. You will be able to create and upload p2p websites.

on a regular website, on the html file you would have
```
<html>
<head>
<title>
test
</title>
</head>

<div>
<p>test</p>
<img src="http://domain.com/some/file.jpeg"/>
</div>

</html>
```

with with hybrid, you can do the same AND MORE like the following
```
<html>
<head>
<title>
test
</title>
</head>

<div>
<p>http example, regular http link</p>
<img src="http://domain.com/some/file.jpeg"/>

<p>bittorrent example, loading from p2p network using p2p link</p>
<img src="bt://infohashORpublickey/example.jpeg"/>
</div>

</html>
```

![Hybrid Animation](animation.gif)

This makes it possible to create fully peer to peer websites, no middlemen and no servers.

This project was forked from [Agregore Browser](https://github.com/AgregoreWeb/agregore-browser).
Special thanks and shout out to [RangerMauve](https://github.com/RangerMauve), they are the creator and developer of Agregore.