package node

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "time"
)

// NewNode creates a new Node instance with default values
func NewNode(client, publicKey, url, version, name string, isValidator bool) *Node {
    return &Node{
        Client:      client,
        PublicKey:   publicKey,
        URL:         url,
        Version:     version,
        IsValidator: isValidator,
        Name:        name,
        Height:      0,
    }
}

// ToJSON converts the Node to a map for JSON serialization
func (n *Node) ToJSON() map[string]interface{} {
    return map[string]interface{}{
        "client":      n.Client,
        "publicKey":   n.PublicKey,
        "url":        n.URL,
        "version":    n.Version,
        "isValidator": n.IsValidator,
        "name":       n.Name,
        "height":     n.Height,
    }
}

// FromJSON populates the Node from a JSON map
func (n *Node) FromJSON(data map[string]interface{}) error {
    if client, ok := data["client"].(string); ok {
        n.Client = client
    }
    if publicKey, ok := data["publicKey"].(string); ok {
        n.PublicKey = publicKey
    }
    if url, ok := data["url"].(string); ok {
        n.URL = url
    }
    if version, ok := data["version"].(string); ok {
        n.Version = version
    }
    if isValidator, ok := data["isValidator"].(bool); ok {
        n.IsValidator = isValidator
    }
    if name, ok := data["name"].(string); ok {
        n.Name = name
    }
    if height, ok := data["height"].(float64); ok {
        n.Height = int64(height)
    }
    return nil
}

// GetTime returns the block timestamp as a time.Time
func (b *Block) GetTime() time.Time {
    return time.UnixMilli(b.Timestamp)
}

// FetchBootnodes retrieves and parses the bootnode list from the given URL
func FetchBootnodes(url string) ([]*Node, error) {
    resp, err := http.Get(url)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return nil, err
    }

    var nodesData []map[string]interface{}
    if err := json.Unmarshal(body, &nodesData); err != nil {
        return nil, err
    }

    nodes := make([]*Node, len(nodesData))
    for i, nodeData := range nodesData {
        node := &Node{}
        if err := node.FromJSON(nodeData); err != nil {
            return nil, err
        }
        nodes[i] = node
    }

    return nodes, nil
}

// GetBlocks fetches blocks from all nodes concurrently
func GetBlocks(nodes []*Node) []NodeBlocks {
    results := make([]NodeBlocks, len(nodes))
    done := make(chan int)

    client := &http.Client{
        Timeout: 10 * time.Second,
    }

    for i, node := range nodes {
        go func(index int, node *Node) {
            result := NodeBlocks{Node: node}

            rpcReq := RPCRequest{
                Method:  "get_blocks",
                Params:  []interface{}{},
                ID:      1,
                JSONRPC: "2.0",
            }

            reqBody, err := json.Marshal(rpcReq)
            if err != nil {
                result.Error = fmt.Errorf("error marshaling request: %v", err)
                results[index] = result
                done <- index
                return
            }

            req, err := http.NewRequest("POST", node.URL, bytes.NewBuffer(reqBody))
            if err != nil {
                result.Error = fmt.Errorf("error creating request: %v", err)
                results[index] = result
                done <- index
                return
            }
            req.Header.Set("Content-Type", "application/json")

            resp, err := client.Do(req)
            if err != nil {
                result.Error = fmt.Errorf("error making request: %v", err)
                results[index] = result
                done <- index
                return
            }
            defer resp.Body.Close()

            var blocksResp BlocksResponse
            if err := json.NewDecoder(resp.Body).Decode(&blocksResp); err != nil {
                result.Error = fmt.Errorf("error decoding response: %v", err)
                results[index] = result
                done <- index
                return
            }

            result.Blocks = blocksResp.Result.Data
            results[index] = result
            done <- index
        }(i, node)
    }

    for i := 0; i < len(nodes); i++ {
        <-done
    }

    return results
}