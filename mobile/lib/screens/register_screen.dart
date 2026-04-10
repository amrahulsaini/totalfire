import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../l10n/app_localization.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _mobileController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  bool _agreeTerms = false;
  bool _isLoading = false;

  @override
  void dispose() {
    _fullNameController.dispose();
    _usernameController.dispose();
    _emailController.dispose();
    _mobileController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;

    if (!_agreeTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.tx('Please agree to the Terms & Conditions')),
          backgroundColor: Colors.redAccent,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    final registerResponse = await ApiService.register(
      fullName: _fullNameController.text.trim(),
      username: _usernameController.text.trim(),
      email: _emailController.text.trim(),
      mobile: _mobileController.text.trim(),
      password: _passwordController.text,
    );

    if (!mounted) return;

    if (!registerResponse.success) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(registerResponse.message),
          backgroundColor: AppColors.accentRed,
        ),
      );
      return;
    }

    final loginResponse = await ApiService.login(
      login: _usernameController.text.trim(),
      password: _passwordController.text,
    );

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (!loginResponse.success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(registerResponse.message),
          backgroundColor: AppColors.accentGreen,
        ),
      );
      Navigator.pushNamedAndRemoveUntil(context, '/login', (route) => false);
      return;
    }

    Navigator.pushNamedAndRemoveUntil(context, '/home', (route) => false);
  }

  void _showGoogleComingSoon() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          context.tx('This feature is not available yet. It will be added soon.'),
        ),
        backgroundColor: AppColors.accentRed,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final tx = context.tx;

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 40),

              // Logo and branding
              Center(
                child: Column(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(18),
                      child: Image.asset(
                        'assets/images/totalfire-logo.webp',
                        width: 80,
                        height: 80,
                        fit: BoxFit.cover,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'TotalFire',
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w900,
                        foreground: Paint()
                          ..shader = const LinearGradient(
                            colors: [
                              AppColors.accentRed,
                              AppColors.accentOrange,
                            ],
                          ).createShader(
                              const Rect.fromLTWH(0, 0, 200, 40)),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      tx('Create your account & start competing'),
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 36),

              // Register Form
              Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Full Name
                    TextFormField(
                      controller: _fullNameController,
                      textInputAction: TextInputAction.next,
                      textCapitalization: TextCapitalization.words,
                      decoration: InputDecoration(
                        labelText: tx('Full Name'),
                        hintText: tx('Enter your full name'),
                        prefixIcon: const Icon(Icons.badge_outlined,
                            color: AppColors.textMuted),
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return tx('Please enter your full name');
                        }
                        if (value.trim().length < 2) {
                          return tx('Name must be at least 2 characters');
                        }
                        return null;
                      },
                    ),

                    const SizedBox(height: 14),

                    // Username
                    TextFormField(
                      controller: _usernameController,
                      textInputAction: TextInputAction.next,
                      inputFormatters: [
                        FilteringTextInputFormatter.allow(
                            RegExp(r'[a-zA-Z0-9_.]')),
                        LengthLimitingTextInputFormatter(20),
                      ],
                      decoration: InputDecoration(
                        labelText: tx('Username'),
                        hintText: tx('Choose a unique username'),
                        prefixIcon: const Icon(Icons.alternate_email,
                            color: AppColors.textMuted),
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return tx('Please choose a username');
                        }
                        if (value.trim().length < 3) {
                          return tx('Username must be at least 3 characters');
                        }
                        if (!RegExp(r'^[a-zA-Z0-9_.]+$').hasMatch(value)) {
                          return tx('Only letters, numbers, dots and underscores');
                        }
                        return null;
                      },
                    ),

                    const SizedBox(height: 14),

                    // Email
                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.next,
                      inputFormatters: [
                        FilteringTextInputFormatter.deny(RegExp(r'\s')),
                      ],
                      decoration: InputDecoration(
                        labelText: tx('Email'),
                        hintText: tx('Enter your email address'),
                        prefixIcon: const Icon(Icons.email_outlined,
                            color: AppColors.textMuted),
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return tx('Please enter your email');
                        }
                        if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
                            .hasMatch(value.trim())) {
                          return tx('Please enter a valid email');
                        }
                        return null;
                      },
                    ),

                    const SizedBox(height: 14),

                    // Mobile Number
                    TextFormField(
                      controller: _mobileController,
                      keyboardType: TextInputType.phone,
                      textInputAction: TextInputAction.next,
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                        LengthLimitingTextInputFormatter(10),
                      ],
                      decoration: InputDecoration(
                        labelText: tx('Mobile Number'),
                        hintText: tx('Enter 10-digit mobile number'),
                        prefixIcon: const Icon(Icons.phone_android_outlined,
                            color: AppColors.textMuted),
                        prefixText: '+91  ',
                        prefixStyle: const TextStyle(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w600,
                          fontSize: 15,
                        ),
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return tx('Please enter your mobile number');
                        }
                        if (value.trim().length != 10) {
                          return tx('Mobile number must be 10 digits');
                        }
                        return null;
                      },
                    ),

                    const SizedBox(height: 14),

                    // Password
                    TextFormField(
                      controller: _passwordController,
                      obscureText: _obscurePassword,
                      textInputAction: TextInputAction.next,
                      decoration: InputDecoration(
                        labelText: tx('Password'),
                        hintText: tx('Create a strong password'),
                        prefixIcon: const Icon(Icons.lock_outline,
                            color: AppColors.textMuted),
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscurePassword
                                ? Icons.visibility_off_outlined
                                : Icons.visibility_outlined,
                            color: AppColors.textMuted,
                          ),
                          onPressed: () {
                            setState(
                                () => _obscurePassword = !_obscurePassword);
                          },
                        ),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return tx('Please create a password');
                        }
                        if (value.length < 8) {
                          return tx('Password must be at least 8 characters');
                        }
                        if (!RegExp(r'(?=.*[A-Z])').hasMatch(value)) {
                          return tx('Include at least one uppercase letter');
                        }
                        if (!RegExp(r'(?=.*[0-9])').hasMatch(value)) {
                          return tx('Include at least one number');
                        }
                        return null;
                      },
                    ),

                    const SizedBox(height: 14),

                    // Confirm Password
                    TextFormField(
                      controller: _confirmPasswordController,
                      obscureText: _obscureConfirm,
                      textInputAction: TextInputAction.done,
                      decoration: InputDecoration(
                        labelText: tx('Confirm Password'),
                        hintText: tx('Re-enter your password'),
                        prefixIcon: const Icon(Icons.lock_outline,
                            color: AppColors.textMuted),
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscureConfirm
                                ? Icons.visibility_off_outlined
                                : Icons.visibility_outlined,
                            color: AppColors.textMuted,
                          ),
                          onPressed: () {
                            setState(
                                () => _obscureConfirm = !_obscureConfirm);
                          },
                        ),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return tx('Please confirm your password');
                        }
                        if (value != _passwordController.text) {
                          return tx('Passwords do not match');
                        }
                        return null;
                      },
                    ),

                    const SizedBox(height: 18),

                    // Terms & Conditions
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        SizedBox(
                          width: 24,
                          height: 24,
                          child: Checkbox(
                            value: _agreeTerms,
                            onChanged: (val) {
                              setState(() => _agreeTerms = val ?? false);
                            },
                            activeColor: AppColors.accentRed,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: GestureDetector(
                            onTap: () {
                              setState(() => _agreeTerms = !_agreeTerms);
                            },
                            child: RichText(
                              text: TextSpan(
                                text: tx('I agree to the '),
                                style: const TextStyle(
                                  color: AppColors.textSecondary,
                                  fontSize: 13,
                                ),
                                children: [
                                  TextSpan(
                                    text: tx('Terms & Conditions'),
                                    style: const TextStyle(
                                      color: AppColors.accentRed,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  TextSpan(text: tx(' and ')),
                                  TextSpan(
                                    text: tx('Privacy Policy'),
                                    style: const TextStyle(
                                      color: AppColors.accentRed,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 24),

                    // Register Button
                    SizedBox(
                      height: 56,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _handleRegister,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.accentRed,
                          disabledBackgroundColor:
                              AppColors.accentRed.withValues(alpha: 0.6),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: _isLoading
                            ? const SizedBox(
                                height: 22,
                                width: 22,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.5,
                                  color: Colors.white,
                                ),
                              )
                            : Text(
                                tx('Register'),
                                style: const TextStyle(
                                  fontSize: 17,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 28),

              // Divider
              Row(
                children: [
                  Expanded(child: Divider(color: Colors.grey.shade300)),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Text(
                      tx('OR'),
                      style: const TextStyle(
                        color: AppColors.textMuted,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  Expanded(child: Divider(color: Colors.grey.shade300)),
                ],
              ),

              const SizedBox(height: 28),

              // Google Sign Up
              SizedBox(
                height: 56,
                child: OutlinedButton.icon(
                  onPressed: _showGoogleComingSoon,
                  icon: const Icon(Icons.g_mobiledata, size: 28),
                  label: Text(tx('Continue with Google')),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.textPrimary,
                    side: BorderSide(color: Colors.grey.shade300, width: 1.5),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 32),

              // Login Link
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    tx('Already have an account? '),
                    style: const TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 14,
                    ),
                  ),
                  GestureDetector(
                    onTap: () {
                      Navigator.pushReplacementNamed(context, '/login');
                    },
                    child: Text(
                      tx('Log In'),
                      style: const TextStyle(
                        color: AppColors.accentRed,
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
