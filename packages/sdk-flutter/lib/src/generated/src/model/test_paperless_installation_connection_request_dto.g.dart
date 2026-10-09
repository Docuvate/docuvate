// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'test_paperless_installation_connection_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$TestPaperlessInstallationConnectionRequestDto
    extends TestPaperlessInstallationConnectionRequestDto {
  @override
  final BuiltMap<String, String>? credentials;

  factory _$TestPaperlessInstallationConnectionRequestDto(
          [void Function(TestPaperlessInstallationConnectionRequestDtoBuilder)?
              updates]) =>
      (new TestPaperlessInstallationConnectionRequestDtoBuilder()
            ..update(updates))
          ._build();

  _$TestPaperlessInstallationConnectionRequestDto._({this.credentials})
      : super._();

  @override
  TestPaperlessInstallationConnectionRequestDto rebuild(
          void Function(TestPaperlessInstallationConnectionRequestDtoBuilder)
              updates) =>
      (toBuilder()..update(updates)).build();

  @override
  TestPaperlessInstallationConnectionRequestDtoBuilder toBuilder() =>
      new TestPaperlessInstallationConnectionRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is TestPaperlessInstallationConnectionRequestDto &&
        credentials == other.credentials;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, credentials.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
            r'TestPaperlessInstallationConnectionRequestDto')
          ..add('credentials', credentials))
        .toString();
  }
}

class TestPaperlessInstallationConnectionRequestDtoBuilder
    implements
        Builder<TestPaperlessInstallationConnectionRequestDto,
            TestPaperlessInstallationConnectionRequestDtoBuilder> {
  _$TestPaperlessInstallationConnectionRequestDto? _$v;

  MapBuilder<String, String>? _credentials;
  MapBuilder<String, String> get credentials =>
      _$this._credentials ??= new MapBuilder<String, String>();
  set credentials(MapBuilder<String, String>? credentials) =>
      _$this._credentials = credentials;

  TestPaperlessInstallationConnectionRequestDtoBuilder() {
    TestPaperlessInstallationConnectionRequestDto._defaults(this);
  }

  TestPaperlessInstallationConnectionRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _credentials = $v.credentials?.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(TestPaperlessInstallationConnectionRequestDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$TestPaperlessInstallationConnectionRequestDto;
  }

  @override
  void update(
      void Function(TestPaperlessInstallationConnectionRequestDtoBuilder)?
          updates) {
    if (updates != null) updates(this);
  }

  @override
  TestPaperlessInstallationConnectionRequestDto build() => _build();

  _$TestPaperlessInstallationConnectionRequestDto _build() {
    _$TestPaperlessInstallationConnectionRequestDto _$result;
    try {
      _$result = _$v ??
          new _$TestPaperlessInstallationConnectionRequestDto._(
              credentials: _credentials?.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'credentials';
        _credentials?.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'TestPaperlessInstallationConnectionRequestDto',
            _$failedField,
            e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
