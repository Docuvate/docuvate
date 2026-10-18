//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'test_paperless_installation_connection_request_dto.g.dart';

/// TestPaperlessInstallationConnectionRequestDto
///
/// Properties:
/// * [credentials] 
@BuiltValue()
abstract class TestPaperlessInstallationConnectionRequestDto implements Built<TestPaperlessInstallationConnectionRequestDto, TestPaperlessInstallationConnectionRequestDtoBuilder> {
  @BuiltValueField(wireName: r'credentials')
  BuiltMap<String, String>? get credentials;

  TestPaperlessInstallationConnectionRequestDto._();

  factory TestPaperlessInstallationConnectionRequestDto([void updates(TestPaperlessInstallationConnectionRequestDtoBuilder b)]) = _$TestPaperlessInstallationConnectionRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(TestPaperlessInstallationConnectionRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<TestPaperlessInstallationConnectionRequestDto> get serializer => _$TestPaperlessInstallationConnectionRequestDtoSerializer();
}

class _$TestPaperlessInstallationConnectionRequestDtoSerializer implements PrimitiveSerializer<TestPaperlessInstallationConnectionRequestDto> {
  @override
  final Iterable<Type> types = const [TestPaperlessInstallationConnectionRequestDto, _$TestPaperlessInstallationConnectionRequestDto];

  @override
  final String wireName = r'TestPaperlessInstallationConnectionRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    TestPaperlessInstallationConnectionRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.credentials != null) {
      yield r'credentials';
      yield serializers.serialize(
        object.credentials,
        specifiedType: const FullType(BuiltMap, [FullType(String), FullType(String)]),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    TestPaperlessInstallationConnectionRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required TestPaperlessInstallationConnectionRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'credentials':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltMap, [FullType(String), FullType(String)]),
          ) as BuiltMap<String, String>;
          result.credentials.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  TestPaperlessInstallationConnectionRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = TestPaperlessInstallationConnectionRequestDtoBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

