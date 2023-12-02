---
layout: about
title: about
permalink: /
subtitle: <a href='https://neu.edu'>Northeastern University</a>. Undergraduate.<br>tahboub.h [at] northeastern [dot] edu

profile:
  align: right
  image: me.png
  image_circular: true # crops the image to make it circular
  address: 

news: false            # includes a list of news items
latest_posts: false    # includes a list of the newest posts
selected_papers: false # includes a list of papers marked as "selected={true}"
social: false          # includes social icons at the bottom of the page
---
<script>
    var pattern = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    var current = 0;
    var isTimePassed = false;

    var keyHandler = function (event) {
        if (isTimePassed || (pattern.indexOf(event.key) >= 0 && event.key === pattern[current])) {
            current++;
            if (pattern.length === current || isTimePassed) {
                current = 0;
                document.getElementById("howard").style.display = "block";
            }
        } else {
            current = 0;
        }
    };

    document.addEventListener('keydown', keyHandler, false);

    // Function to check if 30 minutes have passed
    function checkTime() {
        isTimePassed = true;
        document.getElementById("howard").style.display = "block";
    }

    // Call checkTime after 30 minutes
    setTimeout(checkTime, 1800000); // 1800000 milliseconds = 30 minutes
</script>
<img style="display: none; position: fixed;" id="howard" src="assets/img/howard.gif" height="600pt">
Hi there! My name is Hamza and I am a data science major at Northeastern University's [Khoury College of Computer Sciences](https://www.khoury.northeastern.edu/).

I am a Research Assistant in Professor [Huaizu Jiang](https://jianghz.me/)'s Visual Intelligence lab at Northeastern University. My main research focus thus far has been commonsense reasoning. Additionally, I have been a Teaching Assistant for the [Fundamentals of Computer Science](https://course.ccs.neu.edu/cs2500/) (CS 2500) course at Northeastern University.

You can find my resume <a target="" href="https://hamzatahboub.com/resume.pdf">here</a>.

If you're curious about my work or have potential opportunities and collaborations in mind, feel free to reach out!

<br>
