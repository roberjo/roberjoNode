$(document).ready(function() {
    "use strict";
    $(".navbar-collapse a").on("click", function() {
        $(".navbar-collapse").collapse("hide")
    });
    $(window).scroll(function() {
        if ($(".navbar").offset().top > 50) {
            $(".navbar-fixed-top").addClass("top-nav-collapse")
        } else {
            $(".navbar-fixed-top").removeClass("top-nav-collapse")
        }
    });
    $(function() {
        $(".custom-navbar a, #home a").bind("click", function(event) {
            var $anchor = $(this);
            $("html, body").stop().animate({
                scrollTop: $($anchor.attr("href")).offset().top - 70
            }, 1e3);
            event.preventDefault()
        })
    });
    $("body").scrollspy({
        target: ".navbar-collapse",
        offset: 95
    });
    var TxtType = function(el, toRotate, period) {
        this.toRotate = toRotate;
        this.el = el;
        this.loopNum = 0;
        this.period = parseInt(period, 10) || 1e3;
        this.txt = "";
        this.tick();
        this.isDeleting = false
    };
    TxtType.prototype.tick = function() {
        var i = this.loopNum % this.toRotate.length;
        var fullTxt = this.toRotate[i];
        if (this.isDeleting) {
            this.txt = fullTxt.substring(0, this.txt.length - 1)
        } else {
            this.txt = fullTxt.substring(0, this.txt.length + 1)
        }
        this.el.innerHTML = '<span class="wrap">' + this.txt + "</span>";
        var that = this;
        var delta = 150 - Math.random() * 100;
        if (this.isDeleting) {
            delta /= 2
        }
        if (!this.isDeleting && this.txt === fullTxt) {
            delta = this.period;
            this.isDeleting = true
        } else if (this.isDeleting && this.txt === "") {
            this.isDeleting = false;
            this.loopNum++;
            delta = 500
        }
        setTimeout(function() {
            that.tick()
        }, delta)
    }
    ;
    window.onload = function() {
        var elements = document.getElementsByClassName("typewrite");
        for (var i = 0; i < elements.length; i++) {
            var toRotate = elements[i].getAttribute("data-type");
            var period = elements[i].getAttribute("data-period");
            if (toRotate) {
                new TxtType(elements[i],JSON.parse(toRotate),period)
            }
        }
        var css = document.createElement("style");
        css.type = "text/css";
        css.innerHTML = ".typewrite > .wrap { border-right: 0.02em solid #333}";
        document.body.appendChild(css)
    }
    ;
    $(".statistic-number").each(function() {
        $(this).appear(function() {
            $(this).prop("Counter", 0).animate({
                Counter: $(this).text()
            }, {
                duration: 4e3,
                easing: "swing",
                step: function(now) {
                    $(this).text(Math.ceil(now))
                }
            })
        }, {
            accX: 0,
            accY: 0
        })
    });
    $(".skills-item").each(function() {
        var perc = $(this).find(".percent").data("percent");
        $(this).data("height", perc)
    });
    $(".touch .skills-item").each(function() {
        $(this).css({
            height: $(this).data("height") + "%"
        })
    });
    $(".touch .skills-bars").css({
        opacity: 1
    });
    $("#skills").appear(function() {
        $(".skills-item").each(function() {
            $(this).css({
                height: $(this).data("height") + "%"
            })
        });
        $(".skills-bars").css({
            opacity: 1
        })
    }, {
        offset: "40%"
    });
    $(".grid").imagesLoaded(function() {
        $(".portfolio-menu").on("click", "li", function() {
            var filterValue = $(this).attr("data-filter");
            $grid.isotope({
                filter: filterValue
            })
        });
        var $grid = $(".grid").isotope({
            itemSelector: ".grid-item",
            percentPosition: true,
            masonry: {
                columnWidth: ".grid-item"
            }
        })
    });
    $(".portfolio-menu li").on("click", function(event) {
        $(this).siblings(".active").removeClass("active");
        $(this).addClass("active");
        event.preventDefault()
    });
    $(".portfolio-lightbox").magnificPopup({
        type: "image",
        gallery: {
            enabled: true
        }
    });
    $(".hire-me").on("click", function(e) {
        e.preventDefault();
        $("html, body").animate({
            scrollTop: $($(this).attr("href")).offset().top - 70
        }, 1500, "linear")
    });
    $("#testimonial-slider").owlCarousel({
        items: 1,
        itemsDesktop: [1e3, 1],
        itemsDesktopSmall: [979, 1],
        itemsTablet: [768, 1],
        pagination: true,
        autoPlay: true
    });
    function initialize() {
        var mapOptions = {
            zoom: 15,
            scrollwheel: false,
            center: new google.maps.LatLng(33.0379691,-85.0310697)
        };
        var map = new google.maps.Map(document.getElementById("googleMap"),mapOptions);
        var marker = new google.maps.Marker({
            position: map.getCenter(),
            animation: google.maps.Animation.BOUNCE,
            icon: "img/map-marker.png",
            map: map
        })
    }
    google.maps.event.addDomListener(window, "load", initialize);
    $("#contact-submit").on("click", function(e) {
        e.preventDefault();
        var error = false;
        var name = $("#name").val();
        var email = $("#email").val();
        var subject = $("#subject").val();
        var message = $("#message").val();
        if (name.length == 0) {
            var error = true;
            $("#name").css("border-color", "#D8000C")
        } else {
            $("#name").css("border-color", "#666")
        }
        if (email.length == 0 || email.indexOf("@") == "-1") {
            var error = true;
            $("#email").css("border-color", "#D8000C")
        } else {
            $("#email").css("border-color", "#666")
        }
        if (subject.length == 0) {
            var error = true;
            $("#subject").css("border-color", "#D8000C")
        } else {
            $("#subject").css("border-color", "#666")
        }
        if (message.length == 0) {
            var error = true;
            $("#message").css("border-color", "#D8000C")
        } else {
            $("#message").css("border-color", "#666")
        }
        if (error == false) {
            $("#contact-submit").attr({
                disabled: "false",
                value: "Sending..."
            });
            $.post("sendmail.php", $("#contact-form").serialize(), function(result) {
                if (result == "sent") {
                    $("#cf-submit").remove();
                    $("#mail-success").fadeIn(500)
                } else {
                    $("#mail-fail").fadeIn(500);
                    $("#contact-submit").removeAttr("disabled").attr("value", "Send The Message")
                }
            })
        }
    });
    $(window).on("scroll", function() {
        if ($(this).scrollTop() >= 800) {
            $("#scroll-top").fadeIn()
        } else {
            $("#scroll-top").fadeOut()
        }
    });
    $("#scroll-top").on("click", function() {
        $("html, body").animate({
            scrollTop: 0
        }, 1500)
    });
    $(window).on("load", function() {
        $(".spinner").fadeOut(function() {
            $("#loading-mask").fadeOut("slow")
        })
    });
    (new WOW).init()
});
