// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'test_paperless_connection_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$TestPaperlessConnectionRequestDto
    extends TestPaperlessConnectionRequestDto {
  @override
  final BuiltMap<String, String> credentials;

  factory _$TestPaperlessConnectionRequestDto(
          [void Function(TestPaperlessConnectionRequestDtoBuilder)? updates]) =>
      (TestPaperlessConnectionRequestDtoBuilder()..update(updates))._build();

  _$TestPaperlessConnectionRequestDto._({required this.credentials})
      : super._();
  @override
  TestPaperlessConnectionRequestDto rebuild(
          void Function(TestPaperlessConnectionRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  TestPaperlessConnectionRequestDtoBuilder toBuilder() =>
      TestPaperlessConnectionRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is TestPaperlessConnectionRequestDto &&
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
    return (newBuiltValueToStringHelper(r'TestPaperlessConnectionRequestDto')
          ..add('credentials', credentials))
        .toString();
  }
}

class TestPaperlessConnectionRequestDtoBuilder
    implements
        Builder<TestPaperlessConnectionRequestDto,
            TestPaperlessConnectionRequestDtoBuilder> {
  _$TestPaperlessConnectionRequestDto? _$v;

  MapBuilder<String, String>? _credentials;
  MapBuilder<String, String> get credentials =>
      _$this._credentials ??= MapBuilder<String, String>();
  set credentials(MapBuilder<String, String>? credentials) =>
      _$this._credentials = credentials;

  TestPaperlessConnectionRequestDtoBuilder() {
    TestPaperlessConnectionRequestDto._defaults(this);
  }

  TestPaperlessConnectionRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _credentials = $v.credentials.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(TestPaperlessConnectionRequestDto other) {
    _$v = other as _$TestPaperlessConnectionRequestDto;
  }

  @override
  void update(
      void Function(TestPaperlessConnectionRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  TestPaperlessConnectionRequestDto build() => _build();

  _$TestPaperlessConnectionRequestDto _build() {
    _$TestPaperlessConnectionRequestDto _$result;
    try {
      _$result = _$v ??
          _$TestPaperlessConnectionRequestDto._(
            credentials: credentials.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'credentials';
        credentials.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'TestPaperlessConnectionRequestDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
