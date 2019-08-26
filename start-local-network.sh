# Start private blockchain & node
docker run -d -p 6869:6869 wavesplatform/waves-private-node

# Start local block explorer using this node
docker run -d -e API_NODE_URL=http://localhost:6869 -e NODE_LIST=http://localhost:6869 -p 3000:8080 wavesplatform/explorer