// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'remote_config_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$RemoteConfigResponseDto extends RemoteConfigResponseDto {
  @override
  final FeatureFlagsResponseDto featureFlags;

  factory _$RemoteConfigResponseDto(
          [void Function(RemoteConfigResponseDtoBuilder)? updates]) =>
      (new RemoteConfigResponseDtoBuilder()..update(updates))._build();

  _$RemoteConfigResponseDto._({required this.featureFlags}) : super._() {
    BuiltValueNullFieldError.checkNotNull(
        featureFlags, r'RemoteConfigResponseDto', 'featureFlags');
  }

  @override
  RemoteConfigResponseDto rebuild(
          void Function(RemoteConfigResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  RemoteConfigResponseDtoBuilder toBuilder() =>
      new RemoteConfigResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is RemoteConfigResponseDto &&
        featureFlags == other.featureFlags;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, featureFlags.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'RemoteConfigResponseDto')
          ..add('featureFlags', featureFlags))
        .toString();
  }
}

class RemoteConfigResponseDtoBuilder
    implements
        Builder<RemoteConfigResponseDto, RemoteConfigResponseDtoBuilder> {
  _$RemoteConfigResponseDto? _$v;

  FeatureFlagsResponseDtoBuilder? _featureFlags;
  FeatureFlagsResponseDtoBuilder get featureFlags =>
      _$this._featureFlags ??= new FeatureFlagsResponseDtoBuilder();
  set featureFlags(FeatureFlagsResponseDtoBuilder? featureFlags) =>
      _$this._featureFlags = featureFlags;

  RemoteConfigResponseDtoBuilder() {
    RemoteConfigResponseDto._defaults(this);
  }

  RemoteConfigResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _featureFlags = $v.featureFlags.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(RemoteConfigResponseDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$RemoteConfigResponseDto;
  }

  @override
  void update(void Function(RemoteConfigResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  RemoteConfigResponseDto build() => _build();

  _$RemoteConfigResponseDto _build() {
    _$RemoteConfigResponseDto _$result;
    try {
      _$result = _$v ??
          new _$RemoteConfigResponseDto._(featureFlags: featureFlags.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'featureFlags';
        featureFlags.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'RemoteConfigResponseDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
