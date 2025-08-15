import { useState, useCallback } from 'react';

// Validation rules
const VALIDATION_RULES = {
    required: (value) => value !== undefined && value !== null && value !== '',
    minLength: (value, min) => value && value.length >= min,
    maxLength: (value, max) => value && value.length <= max,
    email: (value) => {
        if (!value) return true; // Optional field
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
    },
    password: (value) => {
        if (!value) return true; // Optional field
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
        return passwordRegex.test(value);
    },
    date: (value) => {
        if (!value) return true; // Optional field
        const date = new Date(value);
        return !isNaN(date.getTime());
    },
    futureDate: (value) => {
        if (!value) return true; // Optional field
        const date = new Date(value);
        const now = new Date();
        return date > now;
    },
    confirmPassword: (value, confirmValue) => {
        if (!value || !confirmValue) return true;
        return value === confirmValue;
    }
};

// Error messages
const ERROR_MESSAGES = {
    required: 'This field is required',
    minLength: (min) => `Must be at least ${min} characters`,
    maxLength: (max) => `Must be no more than ${max} characters`,
    email: 'Please enter a valid email address',
    password: 'Password must contain at least one lowercase letter, one uppercase letter, and one number',
    date: 'Please enter a valid date',
    futureDate: 'Date cannot be in the past',
    confirmPassword: 'Passwords do not match'
};

// Custom hook for form validation
export const useFormValidation = (initialValues, validationSchema) => {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Validate a single field
    const validateField = useCallback((name, value) => {
        if (!validationSchema[name]) return '';

        const fieldRules = validationSchema[name];
    let errorMessage = '';

    for (const rule of fieldRules) {
        const { type, params = [] } = rule;
        
        if (type === 'required' && !VALIDATION_RULES.required(value)) {
            errorMessage = ERROR_MESSAGES.required;
            break;
        }
        
        if (type === 'minLength' && !VALIDATION_RULES.minLength(value, params[0])) {
            errorMessage = ERROR_MESSAGES.minLength(params[0]);
            break;
        }
        
        if (type === 'maxLength' && !VALIDATION_RULES.maxLength(value, params[0])) {
            errorMessage = ERROR_MESSAGES.maxLength(params[0]);
            break;
        }
        
        if (type === 'email' && !VALIDATION_RULES.email(value)) {
            errorMessage = ERROR_MESSAGES.email;
            break;
        }
        
        if (type === 'password' && !VALIDATION_RULES.password(value)) {
            errorMessage = ERROR_MESSAGES.password;
            break;
        }
        
        if (type === 'date' && !VALIDATION_RULES.date(value)) {
            errorMessage = ERROR_MESSAGES.date;
            break;
        }
        
        if (type === 'futureDate' && !VALIDATION_RULES.futureDate(value)) {
            errorMessage = ERROR_MESSAGES.futureDate;
            break;
        }
        
        if (type === 'confirmPassword' && !VALIDATION_RULES.confirmPassword(value, values[params[0]])) {
            errorMessage = ERROR_MESSAGES.confirmPassword;
            break;
        }
    }

    return errorMessage;
    }, [validationSchema, values]);

    // Validate all fields
    const validateForm = useCallback(() => {
        const newErrors = {};
        
        Object.keys(validationSchema).forEach(fieldName => {
            const error = validateField(fieldName, values[fieldName]);
            if (error) {
                newErrors[fieldName] = error;
            }
        });
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [validationSchema, values, validateField]);

    // Handle input change
    const handleChange = useCallback((name, value) => {
        setValues(prev => ({ ...prev, [name]: value }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
        
        // Mark field as touched
        if (!touched[name]) {
            setTouched(prev => ({ ...prev, [name]: true }));
        }
    }, [errors, touched]);

    // Handle input blur
    const handleBlur = useCallback((name) => {
        const error = validateField(name, values[name]);
        setErrors(prev => ({ ...prev, [name]: error }));
        setTouched(prev => ({ ...prev, [name]: true }));
    }, [validateField, values]);

    // Handle form submission
    const handleSubmit = useCallback(async (onSubmit) => {
        setIsSubmitting(true);
        
        try {
            const isValid = validateForm();
            if (isValid) {
                await onSubmit(values);
            }
        } catch (error) {
            console.error('Form submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    }, [validateForm, values]);

    // Reset form
    const resetForm = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setTouched({});
        setIsSubmitting(false);
    }, [initialValues]);

    // Set form values (useful for editing)
    const setFormValues = useCallback((newValues) => {
        setValues(newValues);
        setErrors({});
        setTouched({});
    }, []);

    // Check if form is valid
    const isValid = Object.keys(errors).length === 0;

    // Check if form has been modified
    const isModified = JSON.stringify(values) !== JSON.stringify(initialValues);

    return {
        values,
        errors,
        touched,
        isSubmitting,
        isValid,
        isModified,
        handleChange,
        handleBlur,
        handleSubmit,
        resetForm,
        setFormValues,
        validateForm
    };
};

// Predefined validation schemas
export const VALIDATION_SCHEMAS = {
    registration: {
        name: [
            { type: 'required' },
            { type: 'minLength', params: [2] },
            { type: 'maxLength', params: [100] }
        ],
        email: [
            { type: 'required' },
            { type: 'email' },
            { type: 'maxLength', params: [255] }
        ],
        password: [
            { type: 'required' },
            { type: 'minLength', params: [6] },
            { type: 'maxLength', params: [128] },
            { type: 'password' }
        ],
        confirmPassword: [
            { type: 'required' },
            { type: 'confirmPassword', params: ['password'] }
        ]
    },
    
    login: {
        email: [
            { type: 'required' },
            { type: 'email' }
        ],
        password: [
            { type: 'required' }
        ]
    },
    
    task: {
        title: [
            { type: 'required' },
            { type: 'minLength', params: [1] },
            { type: 'maxLength', params: [255] }
        ],
        description: [
            { type: 'maxLength', params: [1000] }
        ],
        deadline: [
            { type: 'date' },
            { type: 'futureDate' }
        ],
        reminder_time: [
            { type: 'date' }
        ]
    }
};

export default useFormValidation;
