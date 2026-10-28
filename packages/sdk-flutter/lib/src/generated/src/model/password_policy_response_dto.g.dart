// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'password_policy_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$PasswordPolicyResponseDto extends PasswordPolicyResponseDto {
  @override
  final num minLength;
  @override
  final bool requireLower;
  @override
  final bool requireUpper;
  @override
  final bool requireDigit;
  @override
  final bool requireSymbol;
  @override
  final bool checkBreached;

  factory _$PasswordPolicyResponseDto(
          [void Function(PasswordPolicyResponseDtoBuilder)? updates]) =>
      (new PasswordPolicyResponseDtoBuilder()..update(updates))._build();

  _$PasswordPolicyResponseDto._(
      {required this.minLength,
      required this.requireLower,
      required this.requireUpper,
      required this.requireDigit,
      required this.requireSymbol,
      required this.checkBreached})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        minLength, r'PasswordPolicyResponseDto', 'minLength');
    BuiltValueNullFieldError.checkNotNull(
        requireLower, r'PasswordPolicyResponseDto', 'requireLower');
    BuiltValueNullFieldError.checkNotNull(
        requireUpper, r'PasswordPolicyResponseDto', 'requireUpper');
    BuiltValueNullFieldError.checkNotNull(
        requireDigit, r'PasswordPolicyResponseDto', 'requireDigit');
    BuiltValueNullFieldError.checkNotNull(
        requireSymbol, r'PasswordPolicyResponseDto', 'requireSymbol');
    BuiltValueNullFieldError.checkNotNull(
        checkBreached, r'PasswordPolicyResponseDto', 'checkBreached');
  }

  @override
  PasswordPolicyResponseDto rebuild(
          void Function(PasswordPolicyResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  PasswordPolicyResponseDtoBuilder toBuilder() =>
      new PasswordPolicyResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is PasswordPolicyResponseDto &&
        minLength == other.minLength &&
        requireLower == other.requireLower &&
        requireUpper == other.requireUpper &&
        requireDigit == other.requireDigit &&
        requireSymbol == other.requireSymbol &&
        checkBreached == other.checkBreached;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, minLength.hashCode);
    _$hash = $jc(_$hash, requireLower.hashCode);
    _$hash = $jc(_$hash, requireUpper.hashCode);
    _$hash = $jc(_$hash, requireDigit.hashCode);
    _$hash = $jc(_$hash, requireSymbol.hashCode);
    _$hash = $jc(_$hash, checkBreached.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'PasswordPolicyResponseDto')
          ..add('minLength', minLength)
          ..add('requireLower', requireLower)
          ..add('requireUpper', requireUpper)
          ..add('requireDigit', requireDigit)
          ..add('requireSymbol', requireSymbol)
          ..add('checkBreached', checkBreached))
        .toString();
  }
}

class PasswordPolicyResponseDtoBuilder
    implements
        Builder<PasswordPolicyResponseDto, PasswordPolicyResponseDtoBuilder> {
  _$PasswordPolicyResponseDto? _$v;

  num? _minLength;
  num? get minLength => _$this._minLength;
  set minLength(num? minLength) => _$this._minLength = minLength;

  bool? _requireLower;
  bool? get requireLower => _$this._requireLower;
  set requireLower(bool? requireLower) => _$this._requireLower = requireLower;

  bool? _requireUpper;
  bool? get requireUpper => _$this._requireUpper;
  set requireUpper(bool? requireUpper) => _$this._requireUpper = requireUpper;

  bool? _requireDigit;
  bool? get requireDigit => _$this._requireDigit;
  set requireDigit(bool? requireDigit) => _$this._requireDigit = requireDigit;

  bool? _requireSymbol;
  bool? get requireSymbol => _$this._requireSymbol;
  set requireSymbol(bool? requireSymbol) =>
      _$this._requireSymbol = requireSymbol;

  bool? _checkBreached;
  bool? get checkBreached => _$this._checkBreached;
  set checkBreached(bool? checkBreached) =>
      _$this._checkBreached = checkBreached;

  PasswordPolicyResponseDtoBuilder() {
    PasswordPolicyResponseDto._defaults(this);
  }

  PasswordPolicyResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _minLength = $v.minLength;
      _requireLower = $v.requireLower;
      _requireUpper = $v.requireUpper;
      _requireDigit = $v.requireDigit;
      _requireSymbol = $v.requireSymbol;
      _checkBreached = $v.checkBreached;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(PasswordPolicyResponseDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$PasswordPolicyResponseDto;
  }

  @override
  void update(void Function(PasswordPolicyResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  PasswordPolicyResponseDto build() => _build();

  _$PasswordPolicyResponseDto _build() {
    final _$result = _$v ??
        new _$PasswordPolicyResponseDto._(
            minLength: BuiltValueNullFieldError.checkNotNull(
                minLength, r'PasswordPolicyResponseDto', 'minLength'),
            requireLower: BuiltValueNullFieldError.checkNotNull(
                requireLower, r'PasswordPolicyResponseDto', 'requireLower'),
            requireUpper: BuiltValueNullFieldError.checkNotNull(
                requireUpper, r'PasswordPolicyResponseDto', 'requireUpper'),
            requireDigit: BuiltValueNullFieldError.checkNotNull(
                requireDigit, r'PasswordPolicyResponseDto', 'requireDigit'),
            requireSymbol: BuiltValueNullFieldError.checkNotNull(
                requireSymbol, r'PasswordPolicyResponseDto', 'requireSymbol'),
            checkBreached: BuiltValueNullFieldError.checkNotNull(
                checkBreached, r'PasswordPolicyResponseDto', 'checkBreached'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
