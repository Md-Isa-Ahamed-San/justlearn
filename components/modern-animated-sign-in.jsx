"use client";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import {
    motion,
    useAnimation,
    useInView,
    useMotionTemplate,
    useMotionValue,
} from "motion/react";
import Link from "next/link";
import { forwardRef, memo, useEffect, useRef, useState } from "react";
import { doSocialLogin } from "../app/actions/authActions";
import { Logo } from "./logo";

// ==================== Input Component ====================

const Input = memo(
  forwardRef(function Input({ className, type, ...props }, ref) {
    const radius = 100; // change this to increase the radius of the hover effect
    const [visible, setVisible] = useState(false);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }) {
      const { left, top } = currentTarget.getBoundingClientRect();

      mouseX.set(clientX - left);
      mouseY.set(clientY - top);
    }

    return (
      <motion.div
        style={{
          background: useMotionTemplate`
      radial-gradient(
        ${visible ? radius + "px" : "0px"} circle at ${mouseX}px ${mouseY}px,
        hsl(var(--primary)),
        transparent 80%
      )
    `,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className="group/input rounded-lg p-[2px] transition duration-300"
      >
        <input
          type={type}
          className={cn(
            `shadow-input flex h-10 w-full rounded-md border-none bg-background/80 px-3 py-2 text-sm text-foreground transition duration-400 group-hover/input:shadow-none file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-[2px] focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50`,
            className
          )}
          ref={ref}
          {...props}
        />
      </motion.div>
    );
  })
);

const Select = memo(
  forwardRef(function Select({ className, options = [], ...props }, ref) {
    const radius = 100; // Adjust the hover radius here
    const [visible, setVisible] = useState(false);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }) {
      const { left, top } = currentTarget.getBoundingClientRect();
      mouseX.set(clientX - left);
      mouseY.set(clientY - top);
    }

    return (
      <motion.div
        style={{
          background: useMotionTemplate`
            radial-gradient(
              ${
                visible ? radius + "px" : "0px"
              } circle at ${mouseX}px ${mouseY}px,
              hsl(var(--primary)),
              transparent 80%
            )
          `,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className="group/input rounded-lg p-[2px] transition duration-300"
      >
        <select
          ref={ref}
          className={cn(
            `shadow-input flex h-10 w-full rounded-md border-none bg-background/80 px-3 py-2 text-sm text-foreground transition duration-400 group-hover/input:shadow-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50`,
            className
          )}
          {...props}
        >
          <option disabled value="">
            {props.placeholder || "Select an option"}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </motion.div>
    );
  })
);

export default Select;

Input.displayName = "Input";

const BoxReveal = memo(function BoxReveal({
  children,
  width = "fit-content",
  boxColor,
  duration,
  overflow = "hidden",
  position = "relative",
  className,
}) {
  const mainControls = useAnimation();
  const slideControls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      slideControls.start("visible");
      mainControls.start("visible");
    } else {
      slideControls.start("hidden");
      mainControls.start("hidden");
    }
  }, [isInView, mainControls, slideControls]);

  return (
    <section
      ref={ref}
      style={{
        position: position,
        width,
        overflow,
      }}
      className={className}
    >
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 75 },
          visible: { opacity: 1, y: 0 },
        }}
        initial="hidden"
        animate={mainControls}
        transition={{ duration: duration ?? 0.5, delay: 0.25 }}
      >
        {children}
      </motion.div>
      <motion.div
        variants={{ hidden: { left: 0 }, visible: { left: "100%" } }}
        initial="hidden"
        animate={slideControls}
        transition={{ duration: duration ?? 0.5, ease: "easeIn" }}
        style={{
          position: "absolute",
          top: 4,
          bottom: 4,
          left: 0,
          right: 0,
          zIndex: 20,
          background: boxColor ?? "hsl(var(--primary))",
          borderRadius: 4,
        }}
      />
    </section>
  );
});

const Ripple = memo(function Ripple({
  mainCircleSize = 210,
  mainCircleOpacity = 0.24,
  numCircles = 11,
  className = "",
}) {
  return (
    <section
      className={`max-w-[50%] absolute inset-0 flex items-center justify-center
        bg-muted/50
        [mask-image:linear-gradient(to_bottom,black,transparent)]
        dark:[mask-image:linear-gradient(to_bottom,white,transparent)] ${className}`}
    >
      {Array.from({ length: numCircles }, (_, i) => {
        const size = mainCircleSize + i * 70;
        const opacity = mainCircleOpacity - i * 0.03;
        const animationDelay = `${i * 0.06}s`;
        const borderStyle = i === numCircles - 1 ? "dashed" : "solid";
        const borderOpacity = 5 + i * 5;

        return (
          <span
            key={i}
            className="absolute animate-ripple rounded-full bg-foreground/15 border"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              opacity: opacity,
              animationDelay: animationDelay,
              borderStyle: borderStyle,
              borderWidth: "1px",
              borderColor: `hsl(var(--foreground) / ${borderOpacity / 100})`,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
        );
      })}
    </section>
  );
});

const OrbitingCircles = memo(function OrbitingCircles({
  className,
  children,
  reverse = false,
  duration = 20,
  delay = 10,
  radius = 50,
  path = true,
}) {
  return (
    <>
      {path && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          className="pointer-events-none absolute inset-0 size-full"
        >
          <circle
            className="stroke-border stroke-1"
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
          />
        </svg>
      )}
      <section
        style={{
          "--duration": duration,
          "--radius": radius,
          "--delay": -delay,
        }}
        className={cn(
          "absolute flex size-full transform-gpu animate-orbit items-center justify-center rounded-full border bg-primary/10 [animation-delay:calc(var(--delay)*1000ms)]",
          { "[animation-direction:reverse]": reverse },
          className
        )}
      >
        {children}
      </section>
    </>
  );
});

const TechOrbitDisplay = memo(function TechOrbitDisplay({
  iconsArray,
  text = "JUSTLearn",
}) {
  return (
    <section className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-lg">
      <span className="pointer-events-none whitespace-pre-wrap bg-gradient-to-b from-foreground to-muted-foreground bg-clip-text text-center text-7xl font-semibold leading-none text-transparent">
        <Logo textSize="text-5xl" />
      </span>
      {iconsArray.map((icon, index) => (
        <OrbitingCircles
          key={index}
          className={icon.className}
          duration={icon.duration}
          delay={icon.delay}
          radius={icon.radius}
          path={icon.path}
          reverse={icon.reverse}
        >
          {icon.component()}
        </OrbitingCircles>
      ))}
    </section>
  );
});

const AnimatedForm = memo(function AnimatedForm({
  header,
  subHeader,
  fields,
  submitButton,
  textVariantButton,
  errorField,
  fieldPerRow = 1,
  onSubmit,
  googleLogin,
  goTo,
  registerError,
  loginError,
  submitting,
  setSubmitting
}) {
  const [visible, setVisible] = useState(false);
  const [errors, setErrors] = useState({});

  const toggleVisibility = () => setVisible(!visible);

  const validateForm = (event) => {
    const currentErrors = {};
    fields.forEach((field) => {
      const value = event.target[field.label]?.value;

      if (field.required && !value) {
        currentErrors[field.label] = `${field.label} is required`;
      }

      if (field.type === "email" && value && !/\S+@\S+\.\S+/.test(value)) {
        currentErrors[field.label] = "Invalid email address";
      }

      if (field.type === "password" && value && value.length < 6) {
        currentErrors[field.label] =
          "Password must be at least 6 characters long";
      }
    });
    return currentErrors;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitting(true);
    const formErrors = validateForm(event);

    setErrors({});

    if (Object.keys(formErrors).length === 0) {
      onSubmit(event);
      console.log("Form submitted");
    } else {
      setErrors(formErrors);
    }
  };

  return (
    <section className="max-md:w-full flex flex-col gap-4 w-96 mx-auto">
      <BoxReveal boxColor="hsl(var(--muted))" duration={0.3}>
        <h2 className="font-bold text-3xl text-foreground">{header}</h2>
      </BoxReveal>
      {subHeader && (
        <BoxReveal boxColor="hsl(var(--muted))" duration={0.3} className="pb-2">
          <p className="text-muted-foreground text-sm max-w-sm">{subHeader}</p>
        </BoxReveal>
      )}
      {/* //#MARK:google */}
      {googleLogin && (
        <>
        <form action={doSocialLogin}><BoxReveal
            boxColor="hsl(var(--muted))"
            duration={0.3}
            overflow="visible"
            width="unset"
          >
            <button
              className="g-button group/btn bg-transparent w-full rounded-md border h-10 font-medium outline-hidden hover:cursor-pointer"
              type="submit"
              name="action"
              value="google"
              onClick={() => console.log("Google login clicked")}
            >
              <span className="flex items-center justify-center w-full h-full gap-3">
                {/* <Image
                  src="https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png"
                  width={26}
                  height={26}
                  alt="Google Icon"
                  unoptimized
                /> */}
                {googleLogin}
              </span>

              <BottomGradient />
            </button>
          </BoxReveal></form>
          

          <BoxReveal boxColor="hsl(var(--muted))" duration={0.3} width="100%">
            <section className="flex items-center gap-4">
              <hr className="flex-1 border-1 border-dashed border-border" />
              <p className="text-muted-foreground text-sm">or</p>
              <hr className="flex-1 border-1 border-dashed border-border" />
            </section>
          </BoxReveal>
        </>
      )}
      <form onSubmit={handleSubmit}>
        <section
          className={`grid grid-cols-1 md:grid-cols-${fieldPerRow} mb-4 gap-4`}
        >
          {fields.map((field) => (
            <section key={field.label} className="flex flex-col gap-2">
              <BoxReveal boxColor="hsl(var(--muted))" duration={0.3}>
                <Label htmlFor={field.label}>
                  {field.label}{" "}
                  {field.required && (
                    <span className="text-destructive">*</span>
                  )}
                </Label>
              </BoxReveal>

              <BoxReveal
                width="100%"
                boxColor="hsl(var(--muted))"
                duration={0.3}
                className="flex flex-col space-y-2 w-full"
              >
                {field.type === "select" ? (
                  <Select
                    id={field.label}
                    options={field.options}
                    placeholder={field.placeholder}
                    onChange={field.onChange}
                  />
                ) : (
                  <section className="relative">
                    <Input
                      type={
                        field.type === "password"
                          ? visible
                            ? "text"
                            : "password"
                          : field.type
                      }
                      id={field.label}
                      placeholder={field.placeholder}
                      onChange={field.onChange}
                    />

                    {field.type === "password" && (
                      <button
                        type="button"
                        onClick={toggleVisibility}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-muted-foreground"
                      >
                        {visible ? (
                          <Eye className="h-5 w-5" />
                        ) : (
                          <EyeOff className="h-5 w-5" />
                        )}
                      </button>
                    )}
                  </section>
                )}

                <section className="h-4">
                  {errors[field.label] && (
                    <p className="text-destructive text-xs">
                      {errors[field.label]}
                    </p>
                  )}
                </section>
              </BoxReveal>
            </section>
          ))}
        </section>

        <BoxReveal width="100%" boxColor="hsl(var(--muted))" duration={0.3}>
          {errorField && (
            <p className="text-destructive text-sm mb-4">{errorField}</p>
          )}
        </BoxReveal>
        {registerError && (
          <BoxReveal width="100%" boxColor="hsl(var(--muted))" duration={0.3}>
            <p className="text-destructive text-sm mb-4">
              {typeof registerError === "string"
                ? registerError
                : registerError?.message ||
                  "Registration failed. Please try again."}
            </p>
          </BoxReveal>
        )}
        {loginError && (
          <BoxReveal width="100%" boxColor="hsl(var(--muted))" duration={0.3}>
            <p className="text-destructive text-sm mb-4">
              {typeof loginError === "string"
                ? loginError
                : loginError?.message ||
                  "Registration failed. Please try again."}
            </p>
          </BoxReveal>
        )}

        <BoxReveal
          width="100%"
          boxColor="hsl(var(--muted))"
          duration={0.3}
          overflow="visible"
        >
          <button
            className="bg-gradient-to-br relative group/btn from-background to-muted block w-full text-foreground
            rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_hsl(var(--border))_inset,0px_-1px_0px_0px_hsl(var(--border))_inset] 
            outline-hidden hover:cursor-pointer"
            type="submit"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </span>
            ) : submitButton}
            <BottomGradient />
          </button>
        </BoxReveal>

        {textVariantButton && goTo && (
          <BoxReveal boxColor="hsl(var(--muted))" duration={0.3}>
            <section className="mt-4 text-center hover:cursor-pointer flex gap-4">
              <Link
                className="text-sm text-primary hover:cursor-pointer outline-hidden"
                href={`${
                  textVariantButton === "Have account? Sign In"
                    ? "/login"
                    : "/register"
                }`}
              >
                {textVariantButton}
              </Link>
            </section>
          </BoxReveal>
        )}
      </form>
    </section>
  );
});

const BottomGradient = () => {
  return (
    <>
      <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-primary to-transparent" />
      <span className="group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-accent to-transparent" />
    </>
  );
};

const AuthTabs = memo(function AuthTabs({
  formFields,
  goTo,
  handleSubmit,
  registerError,
  loginError,
  submitting,
  setSubmitting,
  
}) {
  return (
    <div className="flex max-lg:justify-center w-full md:w-auto">
      {/* Right Side */}
      <div className="w-full lg:w-1/2 h-[100dvh] flex flex-col justify-center items-center max-lg:px-[10%]">
        <AnimatedForm
          {...formFields}
          registerError={registerError}
          loginError={loginError}
          fieldPerRow={1}
          onSubmit={handleSubmit}
          goTo={goTo}
          googleLogin="Login with Google"
          submitting={submitting}
          setSubmitting={setSubmitting}
        />
      </div>
    </div>
  );
});

const Label = memo(function Label({ className, ...props }) {
  return (
    <label
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  );
});

// ==================== Exports ====================

export {
    AnimatedForm,
    AuthTabs, BottomGradient, BoxReveal, Input, Label, OrbitingCircles, Ripple, TechOrbitDisplay
};

