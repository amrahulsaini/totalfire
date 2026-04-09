import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../l10n/app_localization.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _usernameController = TextEditingController();
  final _otpController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _isLoading = false;
  bool _obscureNewPassword = true;
  bool _obscureConfirmPassword = true;
  String _username = '';
  String? _maskedEmail;
  String? _resetToken;
  _ForgotPasswordStep _step = _ForgotPasswordStep.username;

  @override
  void dispose() {
    _usernameController.dispose();
    _otpController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _requestOtp() async {
    final username = _usernameController.text.trim().toLowerCase();

    if (username.length < 3 || !RegExp(r'^[a-zA-Z0-9_.]+$').hasMatch(username)) {
      _showError(context.tx('Enter valid username'));
      return;
    }

    setState(() => _isLoading = true);
    final response = await ApiService.requestPasswordResetOtp(username: username);
    if (!mounted) return;
    setState(() => _isLoading = false);

    if (!response.success) {
      _showError(response.message);
      return;
    }

    setState(() {
      _username = username;
      _maskedEmail = response.data?['email']?.toString();
      _step = _ForgotPasswordStep.otp;
    });

    _showSuccess(response.message);
  }

  Future<void> _verifyOtp() async {
    final otp = _otpController.text.trim();

    if (!RegExp(r'^\d{6}$').hasMatch(otp)) {
      _showError(context.tx('OTP must be 6 digits'));
      return;
    }

    setState(() => _isLoading = true);
    final response = await ApiService.verifyPasswordResetOtp(
      username: _username,
      otp: otp,
    );
    if (!mounted) return;
    setState(() => _isLoading = false);

    if (!response.success) {
      _showError(response.message);
      return;
    }

    final token = response.data?['resetToken']?.toString() ?? '';
    if (token.isEmpty) {
      _showError(context.tx('Could not verify OTP'));
      return;
    }

    setState(() {
      _resetToken = token;
      _step = _ForgotPasswordStep.reset;
    });

    _showSuccess(response.message);
  }

  Future<void> _resetPassword() async {
    final newPassword = _newPasswordController.text;
    final confirmPassword = _confirmPasswordController.text;

    if (newPassword.length < 8) {
      _showError(context.tx('Password must be at least 8 characters'));
      return;
    }
    if (!RegExp(r'(?=.*[A-Z])').hasMatch(newPassword)) {
      _showError(context.tx('Include at least one uppercase letter'));
      return;
    }
    if (!RegExp(r'(?=.*[0-9])').hasMatch(newPassword)) {
      _showError(context.tx('Include at least one number'));
      return;
    }
    if (newPassword != confirmPassword) {
      _showError(context.tx('Passwords do not match'));
      return;
    }

    final token = _resetToken;
    if (token == null || token.isEmpty) {
      _showError(context.tx('Could not verify OTP'));
      return;
    }

    setState(() => _isLoading = true);
    final response = await ApiService.resetPasswordWithOtp(
      resetToken: token,
      newPassword: newPassword,
    );
    if (!mounted) return;
    setState(() => _isLoading = false);

    if (!response.success) {
      _showError(response.message);
      return;
    }

    _showSuccess(response.message);
    Navigator.pushNamedAndRemoveUntil(context, '/login', (route) => false);
  }

  void _showError(String text) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(text),
        backgroundColor: AppColors.accentRed,
      ),
    );
  }

  void _showSuccess(String text) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(text),
        backgroundColor: AppColors.accentGreen,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final tx = context.tx;

    return Scaffold(
      appBar: AppBar(
        title: Text(tx('Forgot Password?')),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                tx('Reset your password in 3 steps'),
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                tx('Enter username, verify OTP from email, then set a new password.'),
                style: const TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 24),
              _buildStepIndicator(tx),
              const SizedBox(height: 24),
              if (_step == _ForgotPasswordStep.username) _buildUsernameStep(tx),
              if (_step == _ForgotPasswordStep.otp) _buildOtpStep(tx),
              if (_step == _ForgotPasswordStep.reset) _buildResetStep(tx),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStepIndicator(String Function(String) tx) {
    final labels = [
      tx('Username'),
      tx('OTP Verification'),
      tx('Set New Password'),
    ];

    final activeIndex = _step.index;

    return Row(
      children: List.generate(labels.length, (index) {
        final isActive = index <= activeIndex;
        return Expanded(
          child: Container(
            margin: EdgeInsets.only(right: index == labels.length - 1 ? 0 : 8),
            padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
            decoration: BoxDecoration(
              color: isActive ? AppColors.accentRed : Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isActive ? AppColors.accentRed : AppColors.textMuted.withValues(alpha: 0.35),
              ),
            ),
            child: Text(
              labels[index],
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: isActive ? Colors.white : AppColors.textSecondary,
              ),
            ),
          ),
        );
      }),
    );
  }

  Widget _buildUsernameStep(String Function(String) tx) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TextFormField(
          controller: _usernameController,
          inputFormatters: [
            FilteringTextInputFormatter.allow(RegExp(r'[a-zA-Z0-9_.]')),
            LengthLimitingTextInputFormatter(20),
          ],
          decoration: InputDecoration(
            labelText: tx('Username'),
            hintText: tx('Enter your username'),
            prefixIcon: const Icon(Icons.alternate_email, color: AppColors.textMuted),
          ),
        ),
        const SizedBox(height: 18),
        SizedBox(
          height: 54,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _requestOtp,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.accentRed,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: _isLoading
                ? const SizedBox(
                    height: 22,
                    width: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.4,
                      color: Colors.white,
                    ),
                  )
                : Text(
                    tx('Send OTP to Email'),
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                  ),
          ),
        ),
      ],
    );
  }

  Widget _buildOtpStep(String Function(String) tx) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.textMuted.withValues(alpha: 0.35)),
          ),
          child: Text(
            '${tx('OTP sent to')} ${_maskedEmail ?? 'your email'}',
            style: const TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w600),
          ),
        ),
        const SizedBox(height: 14),
        TextFormField(
          controller: _otpController,
          keyboardType: TextInputType.number,
          inputFormatters: [
            FilteringTextInputFormatter.digitsOnly,
            LengthLimitingTextInputFormatter(6),
          ],
          decoration: InputDecoration(
            labelText: tx('OTP Code'),
            hintText: tx('Enter 6-digit OTP'),
            prefixIcon: const Icon(Icons.verified_outlined, color: AppColors.textMuted),
          ),
        ),
        const SizedBox(height: 18),
        SizedBox(
          height: 54,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _verifyOtp,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.accentRed,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: _isLoading
                ? const SizedBox(
                    height: 22,
                    width: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.4,
                      color: Colors.white,
                    ),
                  )
                : Text(
                    tx('Verify OTP'),
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                  ),
          ),
        ),
      ],
    );
  }

  Widget _buildResetStep(String Function(String) tx) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TextFormField(
          controller: _newPasswordController,
          obscureText: _obscureNewPassword,
          decoration: InputDecoration(
            labelText: tx('New Password'),
            hintText: tx('Create a strong password'),
            prefixIcon: const Icon(Icons.lock_outline, color: AppColors.textMuted),
            suffixIcon: IconButton(
              icon: Icon(
                _obscureNewPassword
                    ? Icons.visibility_off_outlined
                    : Icons.visibility_outlined,
                color: AppColors.textMuted,
              ),
              onPressed: () {
                setState(() => _obscureNewPassword = !_obscureNewPassword);
              },
            ),
          ),
        ),
        const SizedBox(height: 14),
        TextFormField(
          controller: _confirmPasswordController,
          obscureText: _obscureConfirmPassword,
          decoration: InputDecoration(
            labelText: tx('Confirm Password'),
            hintText: tx('Re-enter your password'),
            prefixIcon: const Icon(Icons.lock_outline, color: AppColors.textMuted),
            suffixIcon: IconButton(
              icon: Icon(
                _obscureConfirmPassword
                    ? Icons.visibility_off_outlined
                    : Icons.visibility_outlined,
                color: AppColors.textMuted,
              ),
              onPressed: () {
                setState(() => _obscureConfirmPassword = !_obscureConfirmPassword);
              },
            ),
          ),
        ),
        const SizedBox(height: 18),
        SizedBox(
          height: 54,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _resetPassword,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.accentRed,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: _isLoading
                ? const SizedBox(
                    height: 22,
                    width: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.4,
                      color: Colors.white,
                    ),
                  )
                : Text(
                    tx('Update Password'),
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                  ),
          ),
        ),
      ],
    );
  }
}

enum _ForgotPasswordStep {
  username,
  otp,
  reset,
}
