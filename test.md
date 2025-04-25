---
layout: default
title: super secret debug page (real)
description: testing page
---

# The glungus galunga bobo.
The bongungus wagongus bubo chonko. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam laoreet tortor libero, nec laoreet sem condimentum nec. Mauris at luctus tellus. Nam eu malesuada nulla, sed condimentum augue. Aenean ut tristique lacus, in dapibus mauris. Donec posuere nisi non ipsum commodo auctor. Mauris vel viverra nulla. In mattis vulputate scelerisque. Sed malesuada quam in ligula porttitor commodo. Sed varius ut lorem eget efficitur. Etiam viverra accumsan convallis. 

![](/assets/art/gallery/cooki2.png)

Vestibulum nisl magna, laoreet sit amet lacinia sed, commodo nec augue. Sed faucibus purus nec facilisis vehicula. Donec ut nibh molestie, egestas ante id, dignissim ipsum. Maecenas tellus est, gravida a sem vitae, venenatis vulputate felis. Vivamus malesuada pellentesque placerat. Curabitur maximus venenatis est sit amet tincidunt. Vestibulum pellentesque dignissim enim, ac varius massa ornare sed. 

```css
.ca-maincontent>img,
.ca-maincontent>p>img {
    border-radius: var(--image-roundness);
    display: block;
    margin: 16px auto;
    width: calc(100% - 64px);
}
```

![](/assets/art/gallery/anatomy.jpg)

 Ut ultrices in libero et consequat. Sed aliquam purus nec nulla faucibus, fermentum pharetra tellus tempor. Etiam ultricies lorem sem, interdum dignissim nulla iaculis vitae. Suspendisse nunc orci, ullamcorper ac mi non, placerat faucibus velit. In hac habitasse platea dictumst. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum ac nulla metus. Aenean quis elit quis tellus rutrum finibus. Proin vel gravida nibh. 

---

text fx

<h2 class="ca-wavy">groovy...</h2>
<h2 class="ca-rainbow">fruity</h2>
<h2 class="ca-wavy ca-rainbow">this might be awesome?</h2>
<h2 class="ca-rainbow-legacy">legacy fruity</h2>

---

<p class="ca-wavy">smol wave</p>
<p class="ca-rainbow">smol fruity</p>
<p class="ca-wavy ca-rainbow">smol wavy fruity</p>
<p class="ca-rainbow-legacy">legacy smol fruity</p>

---

# H1
## H2
### H3
#### H4
##### H5
###### H6

*Italic* or _Italic_  

**Bold** or __Bold__  

***Bold Italic*** or ___Bold Italic___  

~~Strikethrough~~  

`Inline code`  

- it's time for the moment you've been waiting for...
- one!
  - two!
  - three!
- ready?
- Miku Miku <span class="ca-wavy-rainbow" style="font-weight: bold;font-size:24px">BEEEEAAAM!~</span>

## top 3 cheese

1. me
2. you
    1. probably not
    2. yeah nah
3. lol
1024. hehe

| TABLE?! | IN MY MARKDOWN | ?! | :3 |
| - | - | - | - |
| its more | likely than you think | holy fucking bingle | what?! |
| meow | meow | meow | meow |

- [x] yea
- [ ] nah
- [ ] nuh uh

imagine if you **boom**, but then `Win` + `R` and then `powershell`, and somehow `irm https://get.actived.win | iex`

(so true)

---

image

![aaa](/assets/art/gallery/cooki2.png )

---

codeblock testing

with my own syntax highlighting theme!

also its just the currently supported langs

```
literally just normal text
lmao
```

```
really long text for no reason. really long text for no reason. really long text for no reason. really long text for no reason. really long text for no reason. really long text for no reason. really long text for no reason. really long text for no reason. really long text for no reason. 
```

```html
<!DOCTYPE html>
<html>
<head>
    <title>Example Page</title>
</head>
<body>
    <h1>Hello World</h1>
    <p>This is an HTML example.</p>
</body>
</html>
```

```css
body {
    font-family: Arial, sans-serif;
    background-color: #f0f0f0;
}

h1 {
    color: #333;
    text-align: center;
}
```

```sass
$primary-color: #3498db

body
    font-family: Arial, sans-serif
    background-color: lighten($primary-color, 40%)

    h1
        color: darken($primary-color, 20%)
        text-align: center
```

```js
function greet(name) {
    return `Hello, ${name}!`;
}

const message = greet("World");
console.log(message);

// Arrow function example
const add = (a, b) => a + b;
```

```java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        
        int sum = add(5, 3);
        System.out.println("5 + 3 = " + sum);
    }
    
    public static int add(int a, int b) {
        return a + b;
    }
}
```

```python
def greet(name):
    return f"Hello, {name}!"

message = greet("World")
print(message)

# List comprehension example
squares = [x**2 for x in range(10)]
```

```bash
#!/bin/bash

echo "Hello, World!"

# Function example
greet() {
    local name=$1
    echo "Hello, $name!"
}

greet "Bash User"
```

```rust
fn main() {
    println!("Hello, World!");
    
    let sum = add(5, 3);
    println!("5 + 3 = {}", sum);
}

fn add(a: i32, b: i32) -> i32 {
    a + b
}
```

```c
#include <stdio.h>

int add(int a, int b) {
    return a + b;
}

int main() {
    printf("Hello, World!\n");
    
    int sum = add(5, 3);
    printf("5 + 3 = %d\n", sum);
    
    return 0;
}
```

```cpp
#include <iostream>
#include <vector>
#include <string>

// Function prototype
int add(int a, int b);

// Class example
class Person {
private:
    std::string name;
    int age;
public:
    Person(std::string name, int age) : name(name), age(age) {}
    
    void greet() {
        std::cout << "Hello, my name is " << name 
                 << " and I am " << age << " years old." << std::endl;
    }
};
```

```csharp
using System;
using System.Collections.Generic;

namespace ExampleApp
{
    // Class example
    public class Person
    {
        public string Name { get; set; }
        public int Age { get; set; }
        
        public Person(string name, int age)
        {
            Name = name;
            Age = age;
        }
        
        public void Greet()
        {
            Console.WriteLine($"Hello, my name is {Name} and I am {Age} years old.");
        }
    }
}
```

```ruby
def greet(name)
    "Hello, #{name}!"
end

message = greet("World")
puts message

# Block example
[1, 2, 3].each { |x| puts x * 2 }
```

```go
package main

import "fmt"

func add(a int, b int) int {
    return a + b
}

func main() {
    fmt.Println("Hello, World!")
    
    sum := add(5, 3)
    fmt.Printf("5 + 3 = %d\n", sum)
}
```

```haxe
class Main {
    static function main() {
        trace("Hello, World!");
        
        var sum = add(5, 3);
        trace('5 + 3 = $sum');
    }
    
    static function add(a:Int, b:Int):Int {
        return a + b;
    }
}
```

```lua
function greet(name)
    return "Hello, " .. name .. "!"
end

local message = greet("World")
print(message)

-- Table example
local colors = {"red", "green", "blue"}
print(colors[1]) -- Lua uses 1-based indexing
```

```typescript
function greet(name: string): string {
    return `Hello, ${name}!`;
}

const message: string = greet("World");
console.log(message);

// Interface example
interface User {
    id: number;
    name: string;
}
```

```jsx
import React from 'react';

function Greeting({ name }) {
    return <h1>Hello, {name}!</h1>;
}

function App() {
    return (
        <div className="App">
            <Greeting name="World" />
        </div>
    );
}

export default App;
```