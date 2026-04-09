Based on your global.css file, here's a comprehensive guide for applying the correct CSS classes:

## **Background Colors**
* **Main containers**: Add `bg-background` for page/section backgrounds
* **Card components**: Add `bg-card` for card backgrounds
* **Form inputs**: Add `bg-input` for input fields, textareas, and select triggers
* **Popovers/Dropdowns**: Add `bg-popover` for dropdown menus and popover content

## **Text Colors**
* **Primary text**: Add `text-foreground` for main text content
* **Card text**: Add `text-card-foreground` for text inside cards
* **Muted text**: Change `text-gray-500`, `text-slate-500` to `text-muted-foreground` for secondary/helper text
* **Popover text**: Add `text-popover-foreground` for dropdown/popover text content

## **Border Colors**
* **All borders**: Change `border` to `border border-border` to use custom border color
* **Form elements**: Ensure inputs, selects, textareas have `border-border`

## **Typography**
* **All headings**: Add `font-poppins font-bold` to h1-h6 elements or components acting as headings
* **Labels**: Add `text-foreground font-poppins font-bold` to FormLabel components
* **Descriptions**: Add `text-muted-foreground` to FormDescription components

## **Form Elements**
* **Input fields**: Add `bg-input border-border text-foreground`
* **Textareas**: Add `bg-input border-border text-foreground`
* **Select triggers**: Add `bg-input border-border text-foreground`
* **Select content**: Add `bg-popover border-border`
* **Select items**: Add `text-popover-foreground`

## **Button Styling**
* **Primary buttons**: Add `bg-primary text-primary-foreground hover:bg-primary/90`
* **Outline buttons**: Add `border-border text-foreground hover:bg-accent hover:text-accent-foreground`
* **Ghost buttons**: Add `text-foreground hover:bg-accent hover:text-accent-foreground`

## **Interactive Elements**
* **Hover states**: Use `hover:bg-accent hover:text-accent-foreground` for interactive elements
* **Focus states**: The `ring` color is already defined in your CSS variables

## **Special Cases**
* **Destructive elements**: Use `bg-destructive text-destructive-foreground` for error/delete buttons
* **Secondary elements**: Use `bg-secondary text-secondary-foreground` for secondary buttons/content
* **Sidebar elements**: Use `bg-sidebar text-sidebar-foreground` if you have sidebar components

This will ensure all your components use your custom color scheme and automatically support both light and dark modes.