import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_app/core/firebase/auth_service.dart';
import 'package:flutter_app/core/firebase/firestore_service.dart';
import 'package:flutter_app/core/models/user.dart';

enum AuthStatus { uninitialized, authenticated, unauthenticated }

class AuthProvider with ChangeNotifier {
  final AuthService _authService;
  final FirestoreService _firestoreService;

  AuthProvider({
    required AuthService authService,
    required FirestoreService firestoreService,
  }) : _authService = authService,
       _firestoreService = firestoreService {
    // Listen to auth state changes
    _authService.authStateChanges.listen(_onAuthStateChanged);
  }

  AuthStatus _status = AuthStatus.uninitialized;
  User? _firebaseUser;
  AppUser? _appUser;
  String? _error;
  bool _isLoading = false;

  // Getters
  AuthStatus get status => _status;
  User? get firebaseUser => _firebaseUser;
  AppUser? get appUser => _appUser;
  String? get error => _error;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _status == AuthStatus.authenticated;
  String? get uid => _firebaseUser?.uid;

  // Handle auth state changes
  void _onAuthStateChanged(User? firebaseUser) async {
    if (firebaseUser == null) {
      _status = AuthStatus.unauthenticated;
      _firebaseUser = null;
      _appUser = null;
      notifyListeners();
    } else {
      _firebaseUser = firebaseUser;
      // Load user data BEFORE setting status to authenticated
      // so the router has appUser available when it redirects
      await _loadUserData(firebaseUser.uid);
      _status = AuthStatus.authenticated;
      notifyListeners();
    }
  }

  // Load user data from Firestore
  Future<void> _loadUserData(String uid) async {
    try {
      _appUser = await _firestoreService.getUser(uid);
    } catch (e) {
      debugPrint('Error loading user data: $e');
    }
  }

  // Sign in with email and password
  Future<bool> signIn(String email, String password) async {
    try {
      _setLoading(true);
      _clearError();

      await _authService.signInWithEmail(email, password);
      return true;
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Register with email and password
  Future<bool> register({
    required String name,
    required String email,
    required String password,
    required UserRole role,
  }) async {
    try {
      _setLoading(true);
      _clearError();

      // Only allow regular and employee roles during registration
      if (role == UserRole.authority) {
        throw Exception(
          'Authority role cannot be assigned during registration',
        );
      }

      // Create auth user
      final credential = await _authService.registerWithEmail(email, password);
      final uid = credential.user!.uid;

      // Create user document in Firestore
      final appUser = AppUser(
        uid: uid,
        name: name,
        email: email,
        role: role,
        createdAt: DateTime.now(),
      );

      await _firestoreService.createUser(appUser);

      return true;
    } catch (e) {
      _setError(e.toString());
      // If Firestore fails, delete the auth user
      if (_authService.currentUser != null) {
        try {
          await _authService.deleteAccount();
        } catch (deleteError) {
          debugPrint('Error cleaning up auth user: $deleteError');
        }
      }
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Sign in with Google
  Future<bool> signInWithGoogle({
    UserRole defaultRole = UserRole.regular,
  }) async {
    try {
      _setLoading(true);
      _clearError();

      final credential = await _authService.signInWithGoogle();
      final uid = credential.user!.uid;
      final email = credential.user!.email ?? '';
      final name = credential.user!.displayName ?? email.split('@').first;

      // Check if user already exists in Firestore
      final existingUser = await _firestoreService.getUser(uid);
      if (existingUser == null) {
        // Create new user document
        final appUser = AppUser(
          uid: uid,
          name: name,
          email: email,
          role: defaultRole,
          createdAt: DateTime.now(),
        );
        await _firestoreService.createUser(appUser);
      }

      return true;
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Sign out
  Future<void> signOut() async {
    try {
      _setLoading(true);
      await _authService.signOut();
    } catch (e) {
      _setError(e.toString());
    } finally {
      _setLoading(false);
    }
  }

  // Update user name
  Future<bool> updateName(String newName) async {
    if (_appUser == null) return false;

    try {
      _setLoading(true);
      _clearError();

      await _firestoreService.updateUser(_appUser!.uid, {'name': newName});
      await _authService.updateDisplayName(newName);

      // Reload user data
      await _loadUserData(_appUser!.uid);

      return true;
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Reset password
  Future<bool> resetPassword(String email) async {
    try {
      _setLoading(true);
      _clearError();

      await _authService.resetPassword(email);
      return true;
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Alias for resetPassword - sends password reset email
  Future<bool> sendPasswordResetEmail(String email) async {
    return resetPassword(email);
  }

  // Reload user data
  Future<void> reloadUserData() async {
    if (_firebaseUser != null) {
      await _loadUserData(_firebaseUser!.uid);
      notifyListeners();
    }
  }

  // Helper methods
  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  void _setError(String message) {
    _error = message;
    notifyListeners();
  }

  void _clearError() {
    _error = null;
  }

  void clearError() {
    _clearError();
    notifyListeners();
  }
}
